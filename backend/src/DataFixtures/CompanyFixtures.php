<?php

namespace App\DataFixtures;

use App\Entity\Company;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class CompanyFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $companies = [
            ['ref' => 'company-blizzard', 'apiId' => 51, 'name' => 'Blizzard Entertainment'],
            ['ref' => 'company-cdpr', 'apiId' => 7681, 'name' => 'CD Projekt Red'],
            ['ref' => 'company-larian', 'apiId' => 5765, 'name' => 'Larian Studios'],
            ['ref' => 'company-valve', 'apiId' => 70, 'name' => 'Valve'],
            ['ref' => 'company-riot', 'apiId' => 1484, 'name' => 'Riot Games'],
        ];

        foreach ($companies as $data) {
            $company = new Company();
            $company->setApiId($data['apiId']);
            $company->setName($data['name']);
            $manager->persist($company);
            $this->addReference($data['ref'], $company);
        }

        $manager->flush();
    }
}
