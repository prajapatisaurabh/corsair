import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service · Tempo",
  description:
    "The terms that govern your use of Tempo, the email and calendar productivity app.",
};

const EFFECTIVE_DATE = "June 16, 2026";
const CONTACT_EMAIL = "saurabhprajapati120@gmail.com";

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" effective={EFFECTIVE_DATE}>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
        use of Tempo (&ldquo;Tempo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;),
        an email and calendar productivity application. By signing in or
        otherwise using Tempo, you agree to these Terms. If you do not agree, do
        not use the service.
      </p>

      <LegalSection title="1. The service">
        <p>
          Tempo connects to your Google account through Google&apos;s OAuth flow
          to help you read, organize, and triage email, detect scheduling
          intent, and create or manage Google Calendar events. Tempo performs
          actions such as sending email or creating events only at your request.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility and accounts">
        <p>
          You must have a valid Google account and be old enough to enter into a
          binding agreement to use Tempo. You are responsible for the activity
          that occurs under your account and for keeping your Google credentials
          secure.
        </p>
      </LegalSection>

      <LegalSection title="3. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>
            Use Tempo for any unlawful, harmful, or abusive purpose, including
            sending spam or unsolicited messages.
          </li>
          <li>
            Attempt to gain unauthorized access to the service, other
            users&apos; data, or our systems.
          </li>
          <li>
            Interfere with, disrupt, or reverse-engineer the service except
            where permitted by law.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Your data and Google APIs">
        <p>
          Your use of Tempo is also subject to Google&apos;s terms. Tempo&apos;s
          use of information received from Google APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          . Our handling of your data is described in our{" "}
          <a href="/privacy">Privacy Policy</a>. You retain all rights to your
          content; you grant us a limited license to process it only to provide
          the service.
        </p>
      </LegalSection>

      <LegalSection title="5. Availability and changes">
        <p>
          Tempo is provided on an ongoing but not guaranteed basis. We may add,
          change, suspend, or discontinue features at any time. We may also
          update these Terms; material changes will be reflected by updating the
          effective date above, and continued use after changes constitutes
          acceptance.
        </p>
      </LegalSection>

      <LegalSection title="6. Disclaimer of warranties">
        <p>
          Tempo is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
          without warranties of any kind, whether express or implied, including
          fitness for a particular purpose and non-infringement. We do not
          warrant that the service will be uninterrupted, error-free, or that
          automated suggestions will always be accurate. You are responsible for
          reviewing email and calendar actions before they are sent or saved.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Tempo and its operators will
          not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or for any loss of data, arising out of or related
          to your use of the service.
        </p>
      </LegalSection>

      <LegalSection title="8. Termination">
        <p>
          You may stop using Tempo and revoke its access to your Google account
          at any time from your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Account permissions
          </a>{" "}
          page. We may suspend or terminate access if you violate these Terms or
          to protect the service.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact us">
        <p>
          Questions about these Terms can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
