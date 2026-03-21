<?php

namespace App\DataFixtures\MasterData;

use App\Entity\Nationality;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Persistence\ObjectManager;

class NationalityFixtures extends Fixture implements FixtureGroupInterface
{
    public static function getGroups(): array
    {
        return ['master'];
    }

    public function load(ObjectManager $manager): void
    {
        // Nationalities sorted by prevalence in German amateur football
        $nationalities = [
            ['name' => 'Deutschland',                   'isoCode' => 'DE'],
            ['name' => 'Österreich',                    'isoCode' => 'AT'],
            ['name' => 'Türkei',                        'isoCode' => 'TR'],
            ['name' => 'Polen',                         'isoCode' => 'PL'],
            ['name' => 'Kroatien',                      'isoCode' => 'HR'],
            ['name' => 'Serbien',                       'isoCode' => 'RS'],
            ['name' => 'Bosnien und Herzegowina',       'isoCode' => 'BA'],
            ['name' => 'Italien',                       'isoCode' => 'IT'],
            ['name' => 'Spanien',                       'isoCode' => 'ES'],
            ['name' => 'Frankreich',                    'isoCode' => 'FR'],
            ['name' => 'Griechenland',                  'isoCode' => 'GR'],
            ['name' => 'Portugal',                      'isoCode' => 'PT'],
            ['name' => 'Niederlande',                   'isoCode' => 'NL'],
            ['name' => 'Ukraine',                       'isoCode' => 'UA'],
            ['name' => 'Rumänien',                      'isoCode' => 'RO'],
            ['name' => 'Brasilien',                     'isoCode' => 'BR'],
            ['name' => 'Nigeria',                       'isoCode' => 'NG'],
            ['name' => 'Ghana',                         'isoCode' => 'GH'],
            ['name' => 'Marokko',                       'isoCode' => 'MA'],
            ['name' => 'Kosovo',                        'isoCode' => 'XK'],
            ['name' => 'Albanien',                      'isoCode' => 'AL'],
            ['name' => 'Nordmazedonien',                'isoCode' => 'MK'],
            ['name' => 'Japan',                         'isoCode' => 'JP'],
            ['name' => 'Argentinien',                   'isoCode' => 'AR'],
            ['name' => 'USA',                           'isoCode' => 'US'],
        ];

        foreach ($nationalities as $nationality) {
            $existing = $manager->getRepository(Nationality::class)->findOneBy([
                'isoCode' => $nationality['isoCode'],
            ]);
            if ($existing) {
                $nationalityEntity = $existing;
                $nationalityEntity->setName($nationality['name']); // keep name updated
            } else {
                $nationalityEntity = new Nationality();
                $nationalityEntity->setName($nationality['name']);
                $nationalityEntity->setIsoCode($nationality['isoCode']);
                $manager->persist($nationalityEntity);
            }

            $this->addReference('nationality_' . strtolower($nationality['isoCode']), $nationalityEntity);
        }

        $manager->flush();
        $manager->clear();
    }
}
