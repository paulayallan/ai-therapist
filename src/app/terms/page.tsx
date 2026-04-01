import { LegalPage, LegalSection } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms & Conditions"
      title="The terms that govern access to Mentara"
      description="These terms explain how the product may be used, the limits of the service, and the responsibilities that apply when you create an account or use paid features."
      lastUpdated="15 March 2026"
    >
      <LegalSection title="Nature of the service">
        <p>
          Mentara is a digital mental health support and self-reflection product. It is not a medical service, crisis
          intervention provider, or replacement for licensed therapy, psychiatric care, or emergency support.
        </p>
      </LegalSection>

      <LegalSection title="Eligibility and account use">
        <p>
          You are responsible for maintaining the confidentiality of your account and for activity that happens under your
          login. You must provide accurate account information and use the service lawfully.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You agree not to misuse the product. This includes, without limitation:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>attempting to disrupt or reverse engineer the service</li>
          <li>using the product for unlawful, abusive, or fraudulent purposes</li>
          <li>uploading malicious code or attempting unauthorized access</li>
          <li>using the service as a substitute for emergency intervention</li>
        </ul>
      </LegalSection>

      <LegalSection title="Health and safety disclaimer">
        <p>
          The service is designed to provide skills-based support, reflection, and pattern awareness. It does not diagnose,
          treat, or cure mental health conditions.
        </p>
        <p>
          If you may be at risk of harming yourself or someone else, or if you are in immediate danger, contact local emergency
          services or a crisis hotline immediately.
        </p>
      </LegalSection>

      <LegalSection title="Paid plans and billing">
        <p>
          Paid subscriptions, if offered, will be governed by the pricing, billing cadence, and cancellation terms shown at the
          time of purchase. Access to premium features may be suspended or removed if payment fails or a subscription ends.
        </p>
      </LegalSection>

      <LegalSection title="No guarantee of outcomes">
        <p>
          We do not guarantee any particular emotional, personal, financial, or health outcome from using the product. The
          service may surface reflections and suggestions, but users remain responsible for their own decisions and actions.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, Mentara and its operators are not liable for indirect, incidental,
          consequential, special, or punitive damages arising from use of the service or reliance on its content.
        </p>
      </LegalSection>

      <LegalSection title="Changes to the service or terms">
        <p>
          We may update the service, pricing, features, or these terms from time to time. Continued use of the service after an
          update means you accept the revised terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For product or legal questions, contact: <a className="text-pine underline" href="mailto:info@bozahealthgroup.com">info@bozahealthgroup.com</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
