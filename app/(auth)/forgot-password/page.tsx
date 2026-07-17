"use client";

import React, { useState, useEffect } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lock, Mail, Eye, EyeOff, CheckCircle } from "lucide-react";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  // Steps: 0 = Email Input, 1 = Verification Code, 2 = Create New Password, 3 = Success
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Password visibility toggles
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Focus OTP inputs on mount of step 1
  useEffect(() => {
    if (step === 1) {
      const firstInput = document.getElementById("otp-0");
      firstInput?.focus();
    }
  }, [step]);

  if (!isLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // Handle back button clicks
  const handleBack = () => {
    setError("");
    if (step === 0) {
      router.push("/login");
    } else {
      setStep((prev) => (prev - 1) as 0 | 1 | 2);
    }
  };

  // Step 0: Submit Email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setStep(1);
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Submit Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join("");
    if (verificationCode.length < 4) {
      setError("Please enter the complete 4-digit code.");
      return;
    }
    setStep(2);
  };

  // Step 2: Submit New Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const verificationCode = code.join("");
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: verificationCode,
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setStep(3);
      } else {
        setError("Password reset incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.message || "Failed to reset password. Please check if the verification code is correct.");
      // If code was wrong, go back to step 1
      if (err.errors?.[0]?.code === "form_code_incorrect") {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP focus shifting helpers
  const handleOtpChange = (index: number, value: string) => {
    // Strip non-numbers
    const cleanVal = value.replace(/[^0-9]/g, "");
    if (!cleanVal) {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      return;
    }

    const digit = cleanVal.slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto focus next input
    if (index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const newCode = [...code];
      // If current input has value, clear it
      if (code[index]) {
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        // If current is empty, focus previous and clear it
        newCode[index - 1] = "";
        setCode(newCode);
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  // Resend code trigger
  const handleResendCode = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      // Clear inputs
      setCode(["", "", "", ""]);
      const firstInput = document.getElementById("otp-0");
      firstInput?.focus();
      alert("A new 4-digit code has been sent to your email.");
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      {step !== 3 && (
        <header className={styles.header}>
          <button 
            type="button" 
            className="backBtn"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
        </header>
      )}

      <div className={styles.cardContent}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* STEP 0: Email Input */}
        {step === 0 && (
          <form onSubmit={handleSendCode} className={styles.form}>
            <div className={styles.textGroup}>
              <h1>Forgot<br />Password</h1>
              <p>Please enter your registered email address to receive a verification code.</p>
            </div>

            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={20} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className={styles.inputField}
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        )}

        {/* STEP 1: Verify Email Code */}
        {step === 1 && (
          <form onSubmit={handleVerifyCode} className={styles.form}>
            <div className={styles.textGroup}>
              <h1>Verify<br />Your Email</h1>
              <p>Please enter the 4 digit code<br />Sent To your mail</p>
            </div>

            <div className={styles.otpRow}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={loading}
                  className={styles.otpBox}
                />
              ))}
            </div>

            <div className={styles.resendWrapper}>
              <button 
                type="button" 
                onClick={handleResendCode}
                className={styles.resendLink}
                disabled={loading}
              >
                Resend Code
              </button>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              Verify
            </button>
          </form>
        )}

        {/* STEP 2: Create New Password */}
        {step === 2 && (
          <form onSubmit={handleSavePassword} className={styles.form}>
            <div className={styles.textGroup}>
              <h1>Create<br />New password</h1>
              <p>Your new password must be different<br />from previously used password</p>
            </div>

            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={20} />
              <input
                type={showPass ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
                minLength={8}
                className={styles.inputField}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                className={styles.eyeBtn}
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={20} />
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className={styles.inputField}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className={styles.eyeBtn}
                title={showConfirmPass ? "Hide password" : "Show password"}
              >
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {step === 3 && (
          <div className={styles.successWrapper}>
            <CheckCircle className={styles.successIcon} size={64} />
            <div className={styles.textGroup} style={{ textAlign: "center" }}>
              <h1>Password<br />Reset!</h1>
              <p>Your password has been successfully updated. You can now log in with your new credentials.</p>
            </div>
            <button 
              type="button" 
              className={styles.submitBtn}
              onClick={() => router.push("/login")}
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
