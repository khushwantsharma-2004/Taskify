const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        course: {
            type: String
        },

        semester: {
            type: Number
        },

        profilePicture: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

userSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model("User", userSchema);