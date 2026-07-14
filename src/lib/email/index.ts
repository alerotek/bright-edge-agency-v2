/**
 * Email module barrel export
 */
export { sendEmail } from "./client";
export type { EmailOptions } from "./client";
export { sendOtpEmail, verifyOtpCode } from "./send-otp";
export {
  otpEmailHtml,
  otpEmailText,
  inquiryNotificationHtml,
  inquiryNotificationText,
} from "./templates";
export type { OtpEmailProps, InquiryNotificationProps } from "./templates";