<?php

namespace App\Tests\Feature\Controller;

use App\Entity\Message;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Tests für die in dieser Session hinzugefügten Features:
 * – senderId / senderIsSuperAdmin in show() und index()
 * – create()-Validierung: unverknüpfte User dürfen nur an ROLE_SUPERADMIN schreiben
 */
class MessageControllerSenderFlagsTest extends WebTestCase
{
    private const PREFIX = 'msgflags-test-';

    private KernelBrowser $client;
    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
    }

    // =========================================================================
    //  show() – senderId + senderIsSuperAdmin
    // =========================================================================

    public function testShowReturnsSenderIdForRegularSender(): void
    {
        $sender = $this->createUser(self::PREFIX . 'sender@example.com');
        $recipient = $this->createUser(self::PREFIX . 'recipient@example.com');
        $message = $this->createMessage($sender, [$recipient], self::PREFIX . 'hello');

        $this->client->loginUser($recipient);
        $this->client->request('GET', '/api/messages/' . $message->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('senderId', $data);
        $this->assertSame($sender->getId(), $data['senderId']);
    }

    public function testShowReturnsSenderIsSuperAdminFalseForRegularUser(): void
    {
        $sender = $this->createUser(self::PREFIX . 'sender2@example.com');
        $recipient = $this->createUser(self::PREFIX . 'recipient2@example.com');
        $message = $this->createMessage($sender, [$recipient], self::PREFIX . 'hello2');

        $this->client->loginUser($recipient);
        $this->client->request('GET', '/api/messages/' . $message->getId());

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertFalse($data['senderIsSuperAdmin']);
    }

    public function testShowReturnsSenderIsSuperAdminTrueWhenSenderIsAdmin(): void
    {
        $admin = $this->createUser(self::PREFIX . 'admin@example.com', ['ROLE_SUPERADMIN', 'ROLE_USER']);
        $recipient = $this->createUser(self::PREFIX . 'recipient3@example.com');
        $message = $this->createMessage($admin, [$recipient], self::PREFIX . 'admin-msg');

        $this->client->loginUser($recipient);
        $this->client->request('GET', '/api/messages/' . $message->getId());

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($data['senderIsSuperAdmin']);
    }

    // =========================================================================
    //  index() – senderId in Inbox-Liste
    // =========================================================================

    public function testIndexReturnsSenderIdForEachMessage(): void
    {
        $sender = $this->createUser(self::PREFIX . 'sender-idx@example.com');
        $recipient = $this->createUser(self::PREFIX . 'recipient-idx@example.com');
        $this->createMessage($sender, [$recipient], self::PREFIX . 'inbox-msg');

        $this->client->loginUser($recipient);
        $this->client->request('GET', '/api/messages');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $testMessages = array_values(array_filter(
            $data['messages'],
            fn ($m) => str_starts_with($m['subject'], self::PREFIX . 'inbox-msg')
        ));

        $this->assertNotEmpty($testMessages);
        $this->assertArrayHasKey('senderId', $testMessages[0]);
        $this->assertSame($sender->getId(), $testMessages[0]['senderId']);
    }

    public function testIndexReturnsSenderIsSuperAdminFlag(): void
    {
        $admin = $this->createUser(self::PREFIX . 'admin-idx@example.com', ['ROLE_SUPERADMIN', 'ROLE_USER']);
        $recipient = $this->createUser(self::PREFIX . 'recipient-idx2@example.com');
        $this->createMessage($admin, [$recipient], self::PREFIX . 'admin-inbox');

        $this->client->loginUser($recipient);
        $this->client->request('GET', '/api/messages');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $adminMessages = array_values(array_filter(
            $data['messages'],
            fn ($m) => str_starts_with($m['subject'], self::PREFIX . 'admin-inbox')
        ));

        $this->assertNotEmpty($adminMessages);
        $this->assertTrue($adminMessages[0]['senderIsSuperAdmin']);
    }

    // =========================================================================
    //  create() – Validierung für unverknüpfte User
    // =========================================================================

    public function testCreateBlocksUnlinkedUserSendingToRegularUser(): void
    {
        // Unverknüpfter User (keine UserRelation mit Spieler/Trainer)
        $unlinked = $this->createUser(self::PREFIX . 'unlinked@example.com');
        $normalUser = $this->createUser(self::PREFIX . 'normal@example.com');

        $this->client->loginUser($unlinked);
        $this->client->request('POST', '/api/messages', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'subject' => self::PREFIX . 'blocked',
            'content' => 'Test',
            'recipientIds' => [$normalUser->getId()],
        ]));

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);
    }

    public function testCreateAllowsUnlinkedUserSendingToSuperAdmin(): void
    {
        $unlinked = $this->createUser(self::PREFIX . 'unlinked2@example.com');
        $admin = $this->createUser(self::PREFIX . 'admin2@example.com', ['ROLE_SUPERADMIN', 'ROLE_USER']);

        $this->client->loginUser($unlinked);
        $this->client->request('POST', '/api/messages', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'subject' => self::PREFIX . 'allowed',
            'content' => 'Antwort auf eure Nachricht',
            'recipientIds' => [$admin->getId()],
        ]));

        $this->assertResponseIsSuccessful();
    }

    public function testCreateBlocksUnlinkedUserSendingToMixedRecipients(): void
    {
        // Wenn auch nur EIN Empfänger kein Superadmin ist → 403
        $unlinked = $this->createUser(self::PREFIX . 'unlinked3@example.com');
        $admin = $this->createUser(self::PREFIX . 'admin3@example.com', ['ROLE_SUPERADMIN', 'ROLE_USER']);
        $normalUser = $this->createUser(self::PREFIX . 'normal3@example.com');

        $this->client->loginUser($unlinked);
        $this->client->request('POST', '/api/messages', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'subject' => self::PREFIX . 'mixed-blocked',
            'content' => 'Test',
            'recipientIds' => [$admin->getId(), $normalUser->getId()],
        ]));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testCreateAllowsSuperAdminToSendToAnyone(): void
    {
        $admin = $this->createUser(self::PREFIX . 'admin4@example.com', ['ROLE_SUPERADMIN', 'ROLE_USER']);
        $recipient = $this->createUser(self::PREFIX . 'anyone@example.com');

        $this->client->loginUser($admin);
        $this->client->request('POST', '/api/messages', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'subject' => self::PREFIX . 'admin-sends',
            'content' => 'Hallo!',
            'recipientIds' => [$recipient->getId()],
        ]));

        $this->assertResponseIsSuccessful();
    }

    // =========================================================================
    //  Helpers
    // =========================================================================

    /** @param string[] $roles */
    private function createUser(string $email, array $roles = ['ROLE_USER']): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName('Test');
        $user->setLastName('User');
        $user->setPassword('password');
        $user->setRoles($roles);
        $user->setIsEnabled(true);
        $user->setIsVerified(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /** @param User[] $recipients */
    private function createMessage(User $sender, array $recipients, string $subject): Message
    {
        $message = new Message();
        $message->setSender($sender);
        $message->setSubject($subject);
        $message->setContent('Test content');
        foreach ($recipients as $r) {
            $message->addRecipient($r);
        }
        $this->entityManager->persist($message);
        $this->entityManager->flush();

        return $message;
    }

    protected function tearDown(): void
    {
        $conn = $this->entityManager->getConnection();

        $conn->executeStatement(
            'DELETE FROM message_recipients WHERE message_id IN (SELECT id FROM messages WHERE subject LIKE :prefix)',
            ['prefix' => self::PREFIX . '%']
        );
        $conn->executeStatement('DELETE FROM messages WHERE subject LIKE :prefix', ['prefix' => self::PREFIX . '%']);
        $conn->executeStatement('DELETE FROM users WHERE email LIKE :prefix', ['prefix' => self::PREFIX . '%']);

        $this->entityManager->close();
        parent::tearDown();
        restore_exception_handler();
    }
}
