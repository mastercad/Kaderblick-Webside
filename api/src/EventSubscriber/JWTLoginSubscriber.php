<?php

namespace App\EventSubscriber;

use App\Entity\User;
use App\Event\DailyLoginEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Cookie;

class JWTLoginSubscriber implements EventSubscriberInterface
{
    public function __construct(private EventDispatcherInterface $dispatcher)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            AuthenticationSuccessEvent::class => 'onAuthenticationSuccess',
        ];
    }

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        // ── Set JWT cookie ────────────────────────────────────────────────────
        $token = $event->getData()['token'];
        $response = $event->getResponse();
        $response->headers->setCookie(
            Cookie::create('jwt_token')
                ->withValue($token)
                ->withHttpOnly(true)
                ->withSecure(true)
                ->withPath('/')
                ->withSameSite('lax')
        );

        // ── Dispatch daily-login XP event ────────────────────────────────────
        $user = $event->getUser();
        if ($user instanceof User) {
            $this->dispatcher->dispatch(new DailyLoginEvent($user));
        }
    }
}
