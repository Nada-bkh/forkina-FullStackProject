// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { Schema } = mongoose;

const UserRole = {
  STUDENT: 'STUDENT',
  TUTOR: 'TUTOR',
  ADMIN: 'ADMIN'
};
const DEPARTMENT = { 
  ARCTIC: "ArcTIC",
  DS: "DS",
  ERP_BI: "ERP/BI",
  GAMIX: "Gamix",
  INFINI: "InFini",
  NIDS: "NIDS",
  SLEAM: "SLEAM",
  SAE: "SAE",
  SE: "SE",
  SIM: "SIM",
  TWIN: "TWIN",
};
const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    birthdate: { type: Date,
      required: false
    },
    classe: { 
      type: Schema.Types.ObjectId,
      ref: 'Class',
      default: null // Default to null if not assigned to a class
    },
    lastName: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { 
      type: String, 
      required: function() {
        return !this.isGoogleUser && !this.isGithubUser; // Password not required for OAuth users
      }
    },
    // CIN - Carte d'Identité Nationale
    cin: { 
      type: String,
      trim: true,
      sparse: true,
      // Required only for students
      required: function() {
        return this.userRole === UserRole.STUDENT;
      }
    },
    // Classe de l'étudiant

    educationLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER'
    },
    department: {
      type: String,
      enum: Object.values(DEPARTMENT),

      default: undefined
    },
    isGoogleUser: { type: Boolean, default: false },
    isGithubUser: { type: Boolean, default: false },
    accountStatus: { type: Boolean, default: true },
    phone: { type: String },
    userRole: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT
    },
    teamRef: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    profilePicture: { type: String },
    faceImage: { type: String }, // Stored path to the face image
    faceDescriptor: { type: [Number] }, // Face descriptor as an array of numbers
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save middleware to hash password if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.userRole,
      isGoogleUser: this.isGoogleUser
    },
    process.env.JWT_SECRET || 'your-jwt-secret',
    { expiresIn: '7d' }
  );
};

// Remove sensitive data from responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.faceDescriptor; // Don't expose face descriptor in API responses
  return obj;
};

module.exports = mongoose.model("User", userSchema);