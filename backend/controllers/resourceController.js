const Subject = require("../models/Subject");
const Task = require("../models/Task");
const Attendance = require("../models/Attendance");
const Note = require("../models/Note");

const models = { subjects: Subject, tasks: Task, attendance: Attendance, notes: Note };
const allowed = {
    subjects: ["name", "code", "teacher", "color", "credits"],
    tasks: ["subjectId", "title", "description", "deadline", "priority", "completed"],
    attendance: ["subjectId", "date", "status", "note"],
    notes: ["subjectId", "title", "content", "tags"]
};
const singular = (type) => type === "attendance" ? "attendance" : type.slice(0, -1);
const populate = (query, type) => type === "subjects" ? query : query.populate("subjectId", "name code");
const data = (req, type) => {
    const result = {};
    allowed[type].forEach((key) => { if (req.body[key] !== undefined) result[key] = req.body[key]; });
    if (type === "notes" && req.file) {
        result.fileName = req.file.originalname;
        result.filePath = req.file.path;
    }
    return result;
};
const ensureSubject = async (userId, subjectId) =>
    !subjectId || await Subject.exists({ _id: subjectId, userId });

const list = (type) => async (req, res) => {
    const filter = { userId: req.user._id };
    if (type === "attendance") {
        const subjects = await Subject.find({ userId: req.user._id }).select("_id");
        const subjectIds = subjects.map((subject) => subject._id);
        filter.subjectId = req.query.subjectId
            ? { $in: subjectIds.filter((subjectId) => String(subjectId) === req.query.subjectId) }
            : { $in: subjectIds };
    } else if (req.query.subjectId) {
        filter.subjectId = req.query.subjectId;
    }
    const items = await populate(models[type].find(filter).sort({ createdAt: -1 }), type);
    res.json({ data: items, [type]: items });
};
const get = (type) => async (req, res) => {
    const item = await populate(models[type].findOne({ _id: req.params.id, userId: req.user._id }), type);
    if (!item) return res.status(404).json({ message: `${singular(type)} not found` });
    res.json({ data: item, [singular(type)]: item });
};
const create = (type) => async (req, res) => {
    if (type !== "subjects" && !await ensureSubject(req.user._id, req.body.subjectId)) return res.status(400).json({ message: "Subject not found" });
    const item = await models[type].create({ ...data(req, type), userId: req.user._id });
    const result = await populate(models[type].findById(item._id), type);
    res.status(201).json({ data: result, [singular(type)]: result });
};
const update = (type) => async (req, res) => {
    if (type !== "subjects" && req.body.subjectId && !await ensureSubject(req.user._id, req.body.subjectId)) return res.status(400).json({ message: "Subject not found" });
    const item = await models[type].findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, data(req, type), { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: `${singular(type)} not found` });
    const result = await populate(models[type].findById(item._id), type);
    res.json({ data: result, [singular(type)]: result });
};
const remove = (type) => async (req, res) => {
    const item = await models[type].findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ message: `${singular(type)} not found` });
    if (type === "subjects") await Attendance.deleteMany({ userId: req.user._id, subjectId: item._id });
    res.json({ message: "Deleted successfully" });
};
const complete = async (req, res) => {
    const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { completed: true }, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ data: task, task });
};
const noteFile = async (req, res) => {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note || !note.filePath) return res.status(404).json({ message: "PDF not found" });
    res.sendFile(note.filePath);
};
const attendanceStats = async (req, res) => {
    const match = { userId: req.user._id };
    const subjects = await Subject.find({ userId: req.user._id }).select("_id");
    const subjectIds = subjects.map((subject) => String(subject._id));
    match.subjectId = req.query.subjectId && subjectIds.includes(req.query.subjectId)
        ? req.query.subjectId
        : { $in: req.query.subjectId ? [] : subjects.map((subject) => subject._id) };
    const rows = await Attendance.aggregate([
        { $match: match },
        { $group: { _id: { subjectId: "$subjectId", status: "$status" }, count: { $sum: 1 } } },
        { $group: { _id: "$_id.subjectId", records: { $push: { status: "$_id.status", count: "$count" } }, total: { $sum: "$count" } } },
        { $lookup: { from: "subjects", localField: "_id", foreignField: "_id", as: "subject" } },
        { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } }
    ]);
    const data = rows.map((row) => {
        const present = row.records.find((record) => record.status === "Present")?.count || 0;
        return {
            subjectId: row._id,
            subjectName: row.subject?.name || "Unknown subject",
            present,
            absent: row.total - present,
            total: row.total,
            percentage: row.total ? Math.round(present * 10000 / row.total) / 100 : 0
        };
    });
    const total = data.reduce((sum, row) => sum + row.total, 0);
    const present = data.reduce((sum, row) => sum + row.present, 0);
    res.json({ data, subjects: data, total, present, absent: total - present, percentage: total ? Math.round(present * 10000 / total) / 100 : 0 });
};
const dashboard = async (req, res) => {
    const [subjects, tasks, recentNotes, totalNotes] = await Promise.all([
        Subject.find({ userId: req.user._id }).select("_id"),
        Task.find({ userId: req.user._id, completed: false }).sort({ deadline: 1 }).populate("subjectId", "name"),
        Note.find({ userId: req.user._id }).sort({ updatedAt: -1, createdAt: -1 }).limit(1).populate("subjectId", "name"),
        Note.countDocuments({ userId: req.user._id })
    ]);
    const subjectIds = subjects.map((subject) => subject._id);
    const totalSubjects = subjects.length;
    const attendance = subjectIds.length
        ? await Attendance.aggregate([{ $match: { userId: req.user._id, subjectId: { $in: subjectIds } } }, { $group: { _id: "$status", count: { $sum: 1 } } }])
        : [];
    const totals = { Present: 0, Absent: 0 };
    attendance.forEach((row) => { totals[row._id] = row.count; });
    const attendanceTotal = totals.Present + totals.Absent;
    const pending = await Task.countDocuments({ userId: req.user._id, completed: false });
    const completed = await Task.countDocuments({ userId: req.user._id, completed: true });
    const priorityRank = { High: 0, Medium: 1, Low: 2 };
    const priorityTask = tasks
        .sort((a, b) => (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1) || new Date(a.deadline || 8640000000000000) - new Date(b.deadline || 8640000000000000))
        .slice(0, 1);
    res.json({
        totals: { subjects: totalSubjects, tasks: pending + completed, notes: totalNotes },
        totalSubjects, totalTasks: pending + completed, totalNotes,
        pending, completed, overallAttendance: attendanceTotal ? Math.round(totals.Present * 10000 / attendanceTotal) / 100 : 0,
        upcomingTasks: priorityTask, recentNotes, attendance: totals
    });
};
module.exports = { list, get, create, update, remove, complete, noteFile, attendanceStats, dashboard };
