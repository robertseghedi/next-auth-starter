import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  url: string;
  appName: string;
}

export function ResetPasswordEmail({ url, appName }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your {appName} password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>{appName}</Heading>
          <Section style={section}>
            <Text style={text}>
              We received a request to reset your password. Click the button
              below to choose a new one. This link expires in 1 hour.
            </Text>
            <Link href={url} style={button}>
              Reset password
            </Link>
            <Text style={textMuted}>
              If the button doesn't work, copy and paste this URL into your
              browser:
            </Text>
            <Text style={link}>{url}</Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't request a password reset, you can safely ignore this
            email. Your password won't be changed.
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
  margin: "0 0 24px",
};

const textMuted: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#a1a1aa",
  margin: "24px 0 8px",
};

const button: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#09090b",
  color: "#fafafa",
  fontSize: "14px",
  fontWeight: 500,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "10px 24px",
  borderRadius: "9999px",
};

const link: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#a1a1aa",
  wordBreak: "break-all" as const,
  margin: "0",
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
