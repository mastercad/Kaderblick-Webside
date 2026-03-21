<?php

namespace App\EventSubscriber;

use App\Entity\User;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/**
 * Aktualisiert den `lastActivityAt`-Zeitstempel des angemeldeten Users
 * bei jedem authentifizierten API-Request – maximal einmal alle 5 Minuten,
 * um übermäßige Datenbankschreibvorgänge zu vermeiden.
 */
class UserActivitySubscriber implements EventSubscriberInterface
{
    private const UPDATE_INTERVAL_SECONDS = 300; // 5 Minuten

    public function __construct(
        private readonly TokenStorageInterface $tokenStorage,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            // KernelEvents::CONTROLLER fires after all KernelEvents::REQUEST listeners
            // (including Symfony's FirewallListener at priority 8 and JWT authentication),
            // so the security token is guaranteed to be populated here.
            KernelEvents::CONTROLLER => ['onKernelController', 0],
        ];
    }

    public function onKernelController(ControllerEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $token = $this->tokenStorage->getToken();
        if (null === $token) {
            return;
        }

        $user = $token->getUser();
        if (!$user instanceof User) {
            return;
        }

        $now = new DateTime();
        $lastActivity = $user->getLastActivityAt();

        // Nur schreiben wenn noch nie gesetzt oder Intervall abgelaufen
        if (null !== $lastActivity) {
            $diffSeconds = $now->getTimestamp() - $lastActivity->getTimestamp();
            if ($diffSeconds < self::UPDATE_INTERVAL_SECONDS) {
                return;
            }
        }

        $user->setLastActivityAt($now);

        // Direktes SQL-Update um Doctrine-Events zu umgehen (minimaler Overhead)
        $this->entityManager->getConnection()->executeStatement(
            'UPDATE users SET last_activity_at = :ts WHERE id = :id',
            ['ts' => $now->format('Y-m-d H:i:s'), 'id' => $user->getId()]
        );
    }
}
