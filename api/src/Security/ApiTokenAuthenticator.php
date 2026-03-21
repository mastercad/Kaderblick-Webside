<?php

namespace App\Security;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

/**
 * Authenticates requests that carry a Personal API Token in the Authorization header.
 *
 * Token format:  Authorization: Bearer kbak_<48 lowercase hex chars>
 *
 * This authenticator only triggers when the Bearer value starts with "kbak_",
 * leaving regular JWT tokens entirely to the LexikJWTAuthenticationBundle.
 *
 * Kalender-Tokens (Präfix "kcal_") werden hier explizit abgelehnt – sie
 * dürfen niemals zur Platform-Authentifizierung genutzt werden.
 * Ein gestohlener Kalender-Token gewährt ausschließlich Lesezugriff auf
 * die /ical/-Endpunkte, nicht aber auf die API.
 */
class ApiTokenAuthenticator extends AbstractAuthenticator
{
    public const TOKEN_PREFIX = 'kbak_';
    public const CALENDAR_TOKEN_PREFIX = 'kcal_';

    public function __construct(private EntityManagerInterface $em)
    {
    }

    public function supports(Request $request): ?bool
    {
        $auth = $request->headers->get('Authorization', '');

        // Kalender-Tokens explizit ausschließen – sie dürfen niemals
        // zur Authentifizierung auf der Platform verwendet werden.
        if (str_starts_with($auth, 'Bearer ' . self::CALENDAR_TOKEN_PREFIX)) {
            return false;
        }

        return str_starts_with($auth, 'Bearer ' . self::TOKEN_PREFIX);
    }

    public function authenticate(Request $request): Passport
    {
        $auth = $request->headers->get('Authorization', '');
        $token = substr($auth, strlen('Bearer '));

        if ('' === $token) {
            throw new CustomUserMessageAuthenticationException('Kein API-Token angegeben.');
        }

        return new SelfValidatingPassport(
            new UserBadge($token, function (string $token) {
                /** @var ?User $user */
                $user = $this->em->getRepository(User::class)->findOneBy(['apiToken' => $token]);

                if (!$user) {
                    throw new CustomUserMessageAuthenticationException('Ungültiger API-Token.');
                }

                if (!$user->isEnabled() || !$user->isVerified()) {
                    throw new CustomUserMessageAuthenticationException('Konto ist nicht aktiv.');
                }

                return $user;
            }),
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        // Let the request continue handled by the controller
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(
            ['error' => $exception->getMessageKey()],
            Response::HTTP_UNAUTHORIZED,
        );
    }
}
