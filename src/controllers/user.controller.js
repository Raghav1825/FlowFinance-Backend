import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { OTP } from "../models/otp.model.js";
import { sendOtpEmail } from "../utils/sendMail.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
    httpOnly: true,
    secure: true
};

// Reusable Helper Function: Generate Access and Refresh Tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

// Reusable Helper Function: Verify Google ID Token
const verifyGoogleToken = async (idToken) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new ApiError(400, "Invalid Google token payload");
        }
        return payload;
    } catch (error) {
        throw new ApiError(400, error.message || "Invalid or expired Google token");
    }
};

// Register User Controller
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, authProvider = "email", idToken, googleToken } = req.body;
    const token = idToken || googleToken;

    // 1. Google Authentication Flow
    if (authProvider === "google" || token) {
        if (!token) {
            throw new ApiError(400, "Google token is required for Google authentication");
        }

        const payload = await verifyGoogleToken(token);
        const { email: googleEmail, name: googleName, sub: googleId } = payload;
        const normalizedEmail = googleEmail.trim().toLowerCase();

        let user = await User.findOne({
            $or: [{ googleId }, { email: normalizedEmail }]
        });

        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save({ validateBeforeSave: false });
            }
        } else {
            user = await User.create({
                fullName: fullName?.trim() || googleName || "Google User",
                email: normalizedEmail,
                googleId,
                authProvider: "google"
            });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        const registeredUser = await User.findById(user._id).select("-password -refreshToken");

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    "User authenticated successfully with Google",
                    { user: registeredUser, accessToken, refreshToken }
                )
            );
    }

    // 2. Email & Password Registration Flow
    if (!fullName || !email || !password) {
        throw new ApiError(400, "fullName, email, and password are required for registration");
    }

    if ([fullName, email, password].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required and cannot be empty");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Password is automatically hashed by model's pre('save') hook
    const user = await User.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        password,
        authProvider: "email"
    });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                201,
                "User registered successfully",
                { user: createdUser, accessToken, refreshToken }
            )
        );
});

// Login User Controller
const loginUser = asyncHandler(async (req, res) => {
    const { email, password, authProvider = "email", idToken, googleToken } = req.body;
    const token = idToken || googleToken;

    // 1. Google Authentication Flow
    if (authProvider === "google" || token) {
        if (!token) {
            throw new ApiError(400, "Google token is required for Google authentication");
        }

        const payload = await verifyGoogleToken(token);
        const { email: googleEmail, name: googleName, sub: googleId } = payload;
        const normalizedEmail = googleEmail.trim().toLowerCase();

        let user = await User.findOne({
            $or: [{ googleId }, { email: normalizedEmail }]
        });

        if (!user) {
            user = await User.create({
                fullName: googleName || "Google User",
                email: normalizedEmail,
                googleId,
                authProvider: "google"
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save({ validateBeforeSave: false });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    "User logged in successfully with Google",
                    { user: loggedInUser, accessToken, refreshToken }
                )
            );
    }

    // 2. Email & Password Login Flow
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        throw new ApiError(404, "User with this email does not exist");
    }

    if (user.authProvider === "google" && !user.password) {
        throw new ApiError(400, "This account was registered using Google. Please log in with Google.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                "User logged in successfully",
                { user: loggedInUser, accessToken, refreshToken }
            )
        );
});

// Logout User Controller
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(
                200,
                "User logged out successfully",
                {}
            )
        );
});

// Refresh Token Controller
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request - Refresh token required");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token - User not found");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    "Access token refreshed successfully",
                    { accessToken, refreshToken: newRefreshToken }
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// Forgot Password Controller
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        throw new ApiError(404, "User with this email does not exist");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expire_time = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Delete previous OTP records and insert new one
    await OTP.deleteMany({ user_id: user._id });
    await OTP.create({
        user_id: user._id,
        otp,
        expire_time
    });

    // Send OTP email
    await sendOtpEmail(normalizedEmail, otp);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "OTP sent successfully to your email",
                {}
            )
        );
});

// Reset Password Controller
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        throw new ApiError(400, "Email, OTP, and newPassword are required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const otpRecord = await OTP.findOne({
        user_id: user._id,
        otp
    });

    if (!otpRecord) {
        throw new ApiError(400, "Invalid OTP code");
    }

    if (new Date() > new Date(otpRecord.expire_time)) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new ApiError(400, "OTP has expired. Please request a new one");
    }

    user.password = newPassword;
    await user.save(); // Pre-save hook handles bcrypt hashing

    await OTP.deleteOne({ _id: otpRecord._id });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Password reset successfully",
                {}
            )
        );
});

// Delete Account Controller
const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);
    await OTP.deleteMany({ user_id: userId });

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(
                200,
                "Account deleted successfully",
                {}
            )
        );
});

// Update Preferences Controller
const updatePreferences = asyncHandler(async (req, res) => {
    const { budgetAlerts, weeklySummary, goalMilestones, notification } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const notificationData = notification || {};
    const newBudgetAlerts = budgetAlerts !== undefined ? budgetAlerts : notificationData.budgetAlerts;
    const newWeeklySummary = weeklySummary !== undefined ? weeklySummary : notificationData.weeklySummary;
    const newGoalMilestones = goalMilestones !== undefined ? goalMilestones : notificationData.goalMilestones;

    if (newBudgetAlerts !== undefined) {
        user.notification.budgetAlerts = Boolean(newBudgetAlerts);
    }
    if (newWeeklySummary !== undefined) {
        user.notification.weeklySummary = Boolean(newWeeklySummary);
    }
    if (newGoalMilestones !== undefined) {
        user.notification.goalMilestones = Boolean(newGoalMilestones);
    }

    await user.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Preferences updated successfully",
                updatedUser
            )
        );
});

// Update Profile Controller
const updateProfile = asyncHandler(async (req, res) => {
    const { fullName } = req.body;

    if (!fullName || fullName.trim() === "") {
        throw new ApiError(400, "fullName is required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName: fullName.trim()
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Profile updated successfully",
                user
            )
        );
});

// Get Current User Controller
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Current user fetched successfully",
                req.user
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    updateProfile,
    updatePreferences,
    deleteAccount,
};