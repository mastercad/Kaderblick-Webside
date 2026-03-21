<?php

namespace App\DataFixtures\TestData;

use App\Entity\Club;
use App\Entity\Location;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class ClubFixtures extends Fixture implements DependentFixtureInterface, FixtureGroupInterface
{
    public static function getGroups(): array
    {
        return ['test'];
    }

    public function getDependencies(): array
    {
        return [
            LocationFixtures::class
        ];
    }

    public function load(ObjectManager $manager): void
    {
        $stadiumNames = [
            1 => 'Testfußballstadion Nord',
            2 => null,
            3 => 'Arena Süd',
            4 => null,
        ];

        for ($clubNumber = 1; $clubNumber <= 4; ++$clubNumber) {
            $name = 'Club ' . $clubNumber;
            $shortName = 'C' . $clubNumber;
            $location = $this->getReference('location' . $clubNumber, Location::class);
            $existing = $manager->getRepository(Club::class)->findOneBy([
                'name' => $name,
                'shortName' => $shortName,
                'location' => $location,
            ]);
            if ($existing) {
                $this->addReference('club' . $clubNumber, $existing);
                continue;
            }
            $club = new Club();
            $club->setName($name);
            $club->setShortName($shortName);
            $club->setLocation($location);
            $club->setStadiumName($stadiumNames[$clubNumber]);
            $manager->persist($club);
            $this->addReference('club' . $clubNumber, $club);
        }
        $manager->flush();
    }
}
