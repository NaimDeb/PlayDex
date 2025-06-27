<?php

namespace App\Tests;

use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * Base test class with common utilities
 */
abstract class BaseTestCase extends KernelTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        self::bootKernel();
    }

    /**
     * Helper method to create a test database transaction
     */
    protected function beginDatabaseTransaction(): void
    {
        $em = static::getContainer()->get('doctrine')->getManager();
        $em->beginTransaction();
    }

    /**
     * Helper method to rollback test database transaction
     */
    protected function rollbackDatabaseTransaction(): void
    {
        $em = static::getContainer()->get('doctrine')->getManager();
        $em->rollback();
    }

    /**
     * Helper method to clear entity manager
     */
    protected function clearEntityManager(): void
    {
        $em = static::getContainer()->get('doctrine')->getManager();
        $em->clear();
    }
}
