<?php

namespace App\Service;

use App\Entity\SystemSetting;
use App\Repository\SystemSettingRepository;
use DateTimeInterface;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Central access point for all system-level feature flags and settings.
 *
 * Keys are defined as public constants so they can be referenced
 * from controllers, services and tests without magic strings.
 */
class SystemSettingService
{
    /**
     * When true, new users see the RegistrationContextDialog after their first
     * login and are asked to link themselves to a player / coach record.
     * When false, only admins receive a notification and link users manually.
     */
    public const KEY_REGISTRATION_CONTEXT_ENABLED = 'registration_context_enabled';

    public function __construct(
        private SystemSettingRepository $repository,
        private EntityManagerInterface $em,
    ) {
    }

    /**
     * Read a setting. Returns the stored value or $default when not found.
     */
    public function get(string $key, string $default = ''): string
    {
        $setting = $this->repository->findByKey($key);

        return $setting?->getValue() ?? $default;
    }

    /**
     * Read a boolean setting ('true'/'1'/'yes'/'on' → true, everything else → false).
     */
    public function getBool(string $key, bool $default = false): bool
    {
        $setting = $this->repository->findByKey($key);
        if (null === $setting) {
            return $default;
        }

        return in_array(strtolower($setting->getValue()), ['true', '1', 'yes', 'on'], true);
    }

    /**
     * Persist a setting, creating the row if it doesn't exist yet.
     */
    public function set(string $key, string $value): void
    {
        $setting = $this->repository->findByKey($key);
        if (null === $setting) {
            $setting = new SystemSetting($key, $value);
            $this->em->persist($setting);
        } else {
            $setting->setValue($value);
        }

        $this->em->flush();
    }

    /**
     * Returns all settings as a plain array suitable for JSON serialisation.
     *
     * @return array<string, array{value: string, updatedAt: string}>
     */
    public function getAll(): array
    {
        $result = [];
        foreach ($this->repository->findAll() as $setting) {
            $result[$setting->getKey()] = [
                'value' => $setting->getValue(),
                'updatedAt' => $setting->getUpdatedAt()->format(DateTimeInterface::ATOM),
            ];
        }

        return $result;
    }

    /** Returns true when the registration-context dialog is enabled. */
    public function isRegistrationContextEnabled(): bool
    {
        return $this->getBool(self::KEY_REGISTRATION_CONTEXT_ENABLED, true);
    }
}
