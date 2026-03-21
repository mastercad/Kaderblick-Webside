<?php

namespace App\DataFixtures\MasterData;

use App\Entity\Cup;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Persistence\ObjectManager;

class CupFixtures extends Fixture implements FixtureGroupInterface
{
    public static function getGroups(): array
    {
        return ['master'];
    }

    public function load(ObjectManager $manager): void
    {
        $cups = [
            // Nationaler Pokal
            'DFB-Pokal',

            // Regionale Pokale
            'Landespokal',
            'Verbandspokal',
            'Bezirkspokal',
            'Kreispokal',

            // Frauen-Pokale
            'DFB-Pokal Frauen',
            'Landespokal Frauen',

            // Jugend-Pokale
            'DFB-Junioren-Pokal',
            'Landespokal Junioren',

            // Internationale Pokale
            'UEFA Champions League',
            'UEFA Europa League',
            'UEFA Conference League',
            'DFL-Supercup',

            // Lokale Pokale
            'Sparkassenpokal',
            'Sparkassenkreispokal'
        ];

        foreach ($cups as $cupName) {
            $existing = $manager->getRepository(Cup::class)->findOneBy([
                'name' => $cupName,
            ]);
            if ($existing) {
                continue;
            }

            $cup = new Cup();
            $cup->setName($cupName);
            $manager->persist($cup);
        }

        $manager->flush();
    }
}
