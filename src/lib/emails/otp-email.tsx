import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OTPEmailProps {
  otp: string;
  type: string;
  appName: string;
}

const typeLabels: Record<string, { preview: string; heading: string; description: string }> = {
  "sign-in": {
    preview: "Your sign-in code",
    heading: "Sign in code",
    description: "Enter this code to sign in to your account.",
  },
  "email-verification": {
    preview: "Verify your email",
    heading: "Email verification code",
    description: "Enter this code to verify your email address.",
  },
  "forget-password": {
    preview: "Reset your password",
    heading: "Password reset code",
    description: "Enter this code to reset your password.",
  },
};

export function OTPEmail({ otp, type, appName }: OTPEmailProps) {
  const labels = typeLabels[type] ?? typeLabels["sign-in"];

  return (
    <Html>
      <Head />
      <Preview>{labels.preview} — {appName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>{appName}</Heading>
          <Section style={section}>
            <Text style={text}>{labels.heading}</Text>
            <Text style={code}>{otp}</Text>
            <Text style={textMuted}>{labels.description}</Text>
            <Text style={textMuted}>
              This code expires in 5 minutes. Do not share it with anyone.
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't request this code, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container: React.CSSProperties = {
  maxWidth: "480px",
  margin: "40px auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "40px 32px",
};

const heading: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#09090b",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const section: React.CSSProperties = {
  textAlign: "center" as const,
};

const text: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0 0 16px",
};

const code: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: 700,
  letterSpacing: "6px",
  color: "#09090b",
  textAlign: "center" as const,
  margin: "0 0 16px",
  fontFamily: "monospace",
};

const textMuted: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#a1a1aa",
  margin: "0 0 4px",
};

const hr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#a1a1aa",
  textAlign: "center" as const,
  margin: "0",
};
