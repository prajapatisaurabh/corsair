import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy · Tempo",
  description:
    "How Tempo collects, uses, stores, and protects your Google account data.",
};

const EFFECTIVE_DATE = "June 16, 2026";
const CONTACT_EMAIL = "saurabhprajapati120@gmail.com";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" effective={EFFECTIVE_DATE}>
      <p>
        Tempo (&ldquo;Tempo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is an
        email and calendar productivity application that connects to your Google
        account through Google&apos;s OAuth flow. This Privacy Policy explains
        what data we access, why we access it, how we store it, and the choices
        you have. By using Tempo you agree to the practices described here.
      </p>

      <LegalSection title="1. Information we access">
        <p>
          When you sign in with Google and grant consent, Tempo requests access
          to the following Google data through the Gmail and Google Calendar
          APIs:
        </p>
        <ul>
          <li>
            <strong>Profile information</strong> — your name, email address, and
            profile picture, used to identify your account.
          </li>
          <li>
            <strong>Gmail messages and metadata</strong> — used to display your
            inbox, triage email, detect scheduling intent, and (with your
            confirmation) draft and send replies.
          </li>
          <li>
            <strong>Google Calendar events</strong> — used to show your
            availability and to create or update events when you ask Tempo to
            schedule something.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How we use your information">
        <p>
          We use the data we access solely to provide Tempo&apos;s features:
        </p>
        <ul>
          <li>Displaying, organizing, and triaging your email and calendar.</li>
          <li>
            Detecting time and scheduling intent in messages to suggest calendar
            actions.
          </li>
          <li>
            Drafting, sending, or replying to email and creating calendar events
            at your explicit request.
          </li>
        </ul>
        <p>
          Tempo does <strong>not</strong> use your Google data for advertising,
          and we do <strong>not</strong> sell or rent your personal data to any
          third party.
        </p>
      </LegalSection>

      <LegalSection title="3. How we store and protect your data">
        <p>
          Authentication tokens are envelope-encrypted and stored on our backend
          (via Corsair) in a managed Postgres database. Tokens are never exposed
          to the browser. We access the minimum data required to perform the
          action you requested and retain message and event content only as long
          as needed to provide the service.
        </p>
      </LegalSection>

      <LegalSection title="4. Google API Services User Data Policy">
        <p>
          Tempo&apos;s use and transfer of information received from Google APIs
          adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </LegalSection>

      <LegalSection title="5. Data sharing">
        <p>
          We do not share your Google data with third parties except as needed
          to operate the service (for example, our infrastructure and database
          providers), to comply with the law, or with your explicit consent.
        </p>
      </LegalSection>

      <LegalSection title="6. Revoking access and deleting data">
        <p>
          You can revoke Tempo&apos;s access to your Google account at any time
          from your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Account permissions
          </a>{" "}
          page. You may also request deletion of any data we hold by contacting
          us at the address below. Once you revoke access, your stored tokens
          are invalidated.
        </p>
      </LegalSection>

      <LegalSection title="7. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes
          will be reflected by updating the effective date at the top of this
          page.
        </p>
      </LegalSection>

      <LegalSection title="8. Contact us">
        <p>
          If you have questions about this Privacy Policy or how your data is
          handled, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
