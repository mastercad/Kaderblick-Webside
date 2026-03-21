<?php

namespace App\Tests\Unit\Controller;

use App\Controller\Api\CupsController;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class CupsControllerTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private CupsController $controller;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->controller = new CupsController($this->entityManager);
    }

    public function testControllerCanBeInstantiated(): void
    {
        $this->assertInstanceOf(CupsController::class, $this->controller);
    }

    public function testControllerExtendsAbstractController(): void
    {
        $this->assertInstanceOf(AbstractController::class, $this->controller);
    }

    public function testControllerAcceptsEntityManagerDependency(): void
    {
        $em1 = $this->createMock(EntityManagerInterface::class);
        $em2 = $this->createMock(EntityManagerInterface::class);

        $controller1 = new CupsController($em1);
        $controller2 = new CupsController($em2);

        $this->assertInstanceOf(CupsController::class, $controller1);
        $this->assertInstanceOf(CupsController::class, $controller2);
        $this->assertNotSame($controller1, $controller2);
    }
}
