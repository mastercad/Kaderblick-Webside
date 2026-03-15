<?php

namespace App\Service;

use App\Entity\User;
use DateTime;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;

class UserVerificationService
{
    public function __construct(
        private string $frontendUrl,
        private MailerInterface $mailer
    ) {
    }

    /**
     * Creates a new verification token for the user and sets expiration.
     */
    public function createVerificationToken(User $user): string
    {
        $token = bin2hex(random_bytes(32));
        $user->setVerificationToken($token)
             ->setVerificationExpires((new DateTime())->modify('+1 month'))
             ->setIsVerified(false)
             ->setIsEnabled(false);

        return $token;
    }

    /**
     * Sends verification email to the user.
     */
    public function sendVerificationEmail(User $user): void
    {
        $url = rtrim($this->frontendUrl, '/') . '/verify-email/' . $user->getVerificationToken();

        $email = (new TemplatedEmail())
            ->from('no-reply@kaderblick.de')
            ->to($user->getEmail())
            ->subject('Bitte bestätige deine E-Mail')
            ->htmlTemplate('emails/verification.html.twig')
            ->context([
                'name' => $user->getEmail(),
                'signedUrl' => $url
            ]);

        $this->mailer->send($email);
    }
}
