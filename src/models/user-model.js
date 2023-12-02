"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const utils_1 = require("../utils");
/**
 *@todo
 *confirm password field & validate password to match ✅
 *install js validator to validate email, password, username, & names ✅
 *design ERD for users entity & posts entity
 */
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        required: [true, 'username field is compulsory'],
        unique: true,
        trim: true,
        validate: [validator_1.default.isAlphanumeric, 'invalid username']
    },
    email: {
        type: String,
        required: [true, 'email field is compulsory'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator_1.default.isEmail, 'invalid email address']
    },
    lastName: {
        type: String,
        required: true,
        validate: [validator_1.default.isAlpha, 'invalid name']
    },
    firstName: {
        type: String,
        required: true,
        validate: [validator_1.default.isAlpha, 'invalid name']
    },
    gender: {
        type: String,
        validate: {
            validator: function (v) {
                return (v.toLowerCase().trim() === 'female' || 'male');
            },
            message: (props) => `${props.value} invalid gender`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        validate: [validator_1.default.isStrongPassword, 'weak password']
    },
    confirmPassword: {
        type: String,
        required: true,
        validate: {
            validator: function () {
                return this.confirmPassword === this.password;
            }
        }
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'user'],
            message: '{VALUE} is not supported'
        },
        default: 'user'
    },
    nationality: String,
    profession: String,
    dob: Date,
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now() },
    updatedAt: Date
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
/**
 * @todo
 * get password change time in ms
 * get issued at from jwt in ms
 * compare the two timestamps
 * @returns
 */
userSchema.methods.verifyPasswordChange = async function (jwtIssuedAt) {
    const updatedAtMs = parseInt((this.updatedAt.getTime() / 1000).toFixed(), 10);
    return updatedAtMs > jwtIssuedAt;
};
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
        return;
    }
    this.password = await (0, utils_1.encryptPassword)(this.password);
    this.set('confirmPassword', undefined);
    next();
});
const userModel = mongoose_1.default.model('User', userSchema);
exports.default = userModel;
