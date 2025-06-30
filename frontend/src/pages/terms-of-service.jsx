import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

export function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Logo size={48} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using Deacon ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                <p>
                  Deacon is a church management platform that provides tools for managing church operations, including but not limited to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Member and family management</li>
                  <li>Event planning and attendance tracking</li>
                  <li>Task and team oversight</li>
                  <li>Communication tools (SMS and email)</li>
                  <li>Children's ministry check-in/checkout</li>
                  <li>Reporting and analytics</li>
                  <li>Kiosk mode for self-service operations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                <p>
                  To access certain features of the Service, you must create an account. You are responsible for:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use of your account</li>
                  <li>Ensuring your account information is accurate and up-to-date</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Transmit harmful, offensive, or inappropriate content</li>
                  <li>Attempt to gain unauthorized access to the Service or other accounts</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use the Service for commercial purposes not related to church management</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Privacy and Data Protection</h2>
                <p>
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                <p className="mt-2">
                  You are responsible for ensuring compliance with applicable data protection laws in your jurisdiction, including obtaining necessary consents for the collection and processing of personal data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. SMS and Communication Services</h2>
                <p>
                  The Service includes SMS and email communication features. By using these features, you agree to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Comply with all applicable telecommunications laws and regulations</li>
                  <li>Obtain proper consent from recipients before sending messages</li>
                  <li>Respect opt-out requests from recipients</li>
                  <li>Not use the service for spam or unsolicited commercial messages</li>
                  <li>Message and data rates may apply for SMS services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
                <p>
                  The Service and its original content, features, and functionality are owned by Deacon and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
                <p className="mt-2">
                  You retain ownership of any content you submit to the Service, but you grant us a license to use, store, and display that content in connection with providing the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
                <p>
                  We strive to maintain high availability of the Service, but we do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, Deacon shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
                <p>
                  You agree to defend, indemnify, and hold harmless Deacon and its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service or violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
                <p>
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Deacon operates, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p><strong>Email:</strong> support@deacon.app</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 