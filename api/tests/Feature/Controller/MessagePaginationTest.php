<?php

namespace App\Tests\Feature\Controller;

use App\Entity\Message;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Tests for:
 *   - GET /api/messages    (paginated inbox roots + replyCount)
 *   - GET /api/messages/outbox  (paginated outbox roots + replyCount)
 *   - GET /api/messages/thread/{threadId}  (full thread lazy-load)
 *
 * Uses Fixture-Users user21–user25@example.com (ROLE_SUPERADMIN) for JWT-auth
 * so that message creation works without team/club restrictions.
 */
class MessagePaginationTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $entityManager;
    private JWTTokenManagerInterface $jwtManager;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->entityManager = $container->get(EntityManagerInterface::class);
        $this->jwtManager = $container->get(JWTTokenManagerInterface::class);
    }

    // ── Inbox pagination ─────────────────────────────────────────────────────

    public function testInboxReturnsPaginationBlock(): void
    {
        $user = $this->getUser('user21@example.com');
        $sender = $this->getUser('user22@example.com');

        $this->createRoot($sender, [$user], 'pag-test-root1');

        $this->authenticateAs($user);
        $this->client->request('GET', '/api/messages');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('pagination', $data);
        $p = $data['pagination'];
        $this->assertArrayHasKey('page', $p);
        $this->assertArrayHasKey('limit', $p);
        $this->assertArrayHasKey('total', $p);
        $this->assertArrayHasKey('pages', $p);
        $this->assertArrayHasKey('hasMore', $p);
        $this->assertSame(1, $p['page']);
        $this->assertSame(30, $p['limit']);
    }

    public function testInboxChronoModeReturnsAllMessagesIncludingReplies(): void
    {
        // Arrange: sender sends root AND a follow-up reply, both addressed to recipient.
        // Without the parent IS NULL filter, recipient sees both root and reply in their inbox.
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-chrono-root');
        // Sender writes a second message in the same thread (e.g., a correction), addressed to recipient
        $this->createReply($sender, [$recipient], 'pag-test-chrono-reply', $root);

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $subjects = array_column($data['messages'], 'subject');

        $this->assertContains('pag-test-chrono-root', $subjects, 'Root must appear in inbox');
        // Chrono inbox returns ALL received messages — replies are also visible (no parent IS NULL filter)
        $this->assertContains('pag-test-chrono-reply', $subjects, 'Reply must appear in chrono inbox');
    }

    public function testInboxReplyCountIsCorrect(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-replycount-root');
        $this->createReply($recipient, [$sender], 'pag-test-replycount-r1', $root);
        $this->createReply($sender, [$recipient], 'pag-test-replycount-r2', $root);

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $rootMsg = $this->findInList($data['messages'], 'pag-test-replycount-root');

        $this->assertNotNull($rootMsg, 'Root must be in inbox');
        $this->assertArrayHasKey('replyCount', $rootMsg);
        $this->assertSame(2, $rootMsg['replyCount']);
    }

    public function testInboxRootWithNoRepliesHasReplyCountZero(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $this->createRoot($sender, [$recipient], 'pag-test-noreply-root');

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $rootMsg = $this->findInList($data['messages'], 'pag-test-noreply-root');

        $this->assertNotNull($rootMsg);
        $this->assertSame(0, $rootMsg['replyCount']);
    }

    public function testInboxPageParameter(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        // Create 3 root messages
        for ($i = 1; $i <= 3; ++$i) {
            $this->createRoot($sender, [$recipient], "pag-test-page-root-$i");
        }

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages?page=1&limit=2');

        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(2, $data['messages']);
        $this->assertSame(1, $data['pagination']['page']);
        $this->assertSame(2, $data['pagination']['limit']);
        $this->assertTrue($data['pagination']['hasMore']);
    }

    public function testInboxSecondPageReturnsDifferentMessages(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user23@example.com');

        for ($i = 1; $i <= 3; ++$i) {
            $this->createRoot($sender, [$recipient], "pag-test-page2-root-$i");
        }

        $this->authenticateAs($recipient);

        $this->client->request('GET', '/api/messages?page=1&limit=2');
        $page1 = json_decode($this->client->getResponse()->getContent(), true);

        $this->client->request('GET', '/api/messages?page=2&limit=2');
        $page2 = json_decode($this->client->getResponse()->getContent(), true);

        $ids1 = array_column($page1['messages'], 'id');
        $ids2 = array_column($page2['messages'], 'id');

        $this->assertEmpty(array_intersect($ids1, $ids2), 'Pages must not overlap');
        $this->assertFalse($page2['pagination']['hasMore']);
    }

    public function testInboxRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/messages');
        $this->assertResponseStatusCodeSame(401);
    }

    // ── Outbox pagination ────────────────────────────────────────────────────

    public function testOutboxReturnsPaginationBlock(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $this->createRoot($sender, [$recipient], 'pag-test-outbox-root1');

        $this->authenticateAs($sender);
        $this->client->request('GET', '/api/messages/outbox');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('pagination', $data);
        $this->assertSame(1, $data['pagination']['page']);
    }

    public function testOutboxOnlyReturnsRoots(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-outbox-only-root');
        $this->createReply($recipient, [$sender], 'pag-test-outbox-only-reply', $root);

        $this->authenticateAs($sender);
        $this->client->request('GET', '/api/messages/outbox');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $subjects = array_column($data['messages'], 'subject');

        $this->assertContains('pag-test-outbox-only-root', $subjects);
        $this->assertNotContains('pag-test-outbox-only-reply', $subjects, 'Reply from other user must not appear in sender\'s outbox roots');
    }

    public function testOutboxReplyCountIsCorrect(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-outbox-rc-root');
        $this->createReply($recipient, [$sender], 'pag-test-outbox-rc-r1', $root);

        $this->authenticateAs($sender);
        $this->client->request('GET', '/api/messages/outbox');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $rootMsg = $this->findInList($data['messages'], 'pag-test-outbox-rc-root');

        $this->assertNotNull($rootMsg);
        $this->assertSame(1, $rootMsg['replyCount']);
    }

    // ── Thread endpoint ───────────────────────────────────────────────────────

    public function testThreadEndpointRequiresAuthentication(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');
        $root = $this->createRoot($sender, [$recipient], 'pag-test-thread-auth-root');

        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $this->assertResponseStatusCodeSame(401);
    }

    public function testThreadEndpointReturns404ForUnknownId(): void
    {
        $user = $this->getUser('user21@example.com');

        $this->authenticateAs($user);
        $this->client->request('GET', '/api/messages/thread/999999999');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testThreadEndpointReturns404WhenIdIsNotARoot(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-thread-notroot-root');
        $reply = $this->createReply($recipient, [$sender], 'pag-test-thread-notroot-reply', $root);

        $this->authenticateAs($sender);
        $this->client->request('GET', '/api/messages/thread/' . $reply->getId());

        $this->assertResponseStatusCodeSame(404);
    }

    public function testThreadEndpointDeniesOutsider(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');
        $outsider = $this->getUser('user23@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-thread-denied-root');

        $this->authenticateAs($outsider);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $this->assertResponseStatusCodeSame(403);
    }

    public function testThreadEndpointReturnsSingleRootMessage(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-thread-single-root');

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('messages', $data);
        $this->assertCount(1, $data['messages']);
        $this->assertSame('pag-test-thread-single-root', $data['messages'][0]['subject']);
    }

    public function testThreadEndpointReturnsAllRepliesInOrder(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-thread-order-root');
        $reply1 = $this->createReply($recipient, [$sender], 'pag-test-thread-order-r1', $root);
        $this->createReply($sender, [$recipient], 'pag-test-thread-order-r2', $root);

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $subjects = array_column($data['messages'], 'subject');
        $this->assertContains('pag-test-thread-order-root', $subjects);
        $this->assertContains('pag-test-thread-order-r1', $subjects);
        $this->assertContains('pag-test-thread-order-r2', $subjects);
        $this->assertCount(3, $data['messages']);

        // Verify oldest-first ordering by sentAt
        $times = array_column($data['messages'], 'sentAt');
        $sorted = $times;
        sort($sorted);
        $this->assertSame($sorted, $times, 'Messages must be sorted oldest-first');
    }

    public function testThreadEndpointIncludesRequiredFields(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-thread-fields-root');
        $reply = $this->createReply($recipient, [$sender], 'pag-test-thread-fields-reply', $root);

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $data = json_decode($this->client->getResponse()->getContent(), true);
        foreach ($data['messages'] as $msg) {
            $this->assertArrayHasKey('id', $msg);
            $this->assertArrayHasKey('subject', $msg);
            $this->assertArrayHasKey('sender', $msg);
            $this->assertArrayHasKey('sentAt', $msg);
            $this->assertArrayHasKey('isRead', $msg);
            $this->assertArrayHasKey('parentId', $msg);
            $this->assertArrayHasKey('threadId', $msg);
        }

        // Root message has no parentId/threadId
        $rootMsg = $this->findInList($data['messages'], 'pag-test-thread-fields-root');
        $this->assertNull($rootMsg['parentId']);
        $this->assertNull($rootMsg['threadId']);

        // Reply has parentId and threadId pointing to root
        $replyMsg = $this->findInList($data['messages'], 'pag-test-thread-fields-reply');
        $this->assertSame($root->getId(), $replyMsg['parentId']);
        $this->assertSame($root->getId(), $replyMsg['threadId']);
    }

    public function testThreadEndpointAccessibleBySender(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-test-thread-sender-access-root');

        $this->authenticateAs($sender);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $this->assertResponseIsSuccessful();
    }

    public function testThreadEndpointDeepChain(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');

        $root = $this->createRoot($userA, [$userB], 'pag-test-thread-deep-root');
        $reply1 = $this->createReply($userB, [$userA], 'pag-test-thread-deep-r1', $root);
        $reply2 = $this->createReplyWithParent($userA, [$userB], 'pag-test-thread-deep-r2', $root, $reply1);

        $this->authenticateAs($userA);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(3, $data['messages']);

        $r2 = $this->findInList($data['messages'], 'pag-test-thread-deep-r2');
        $this->assertNotNull($r2);
        $this->assertSame($reply1->getId(), $r2['parentId'], 'reply2 parent must be reply1');
        $this->assertSame($root->getId(), $r2['threadId'], 'reply2 thread must point to root');
    }

    // ── Thread endpoint: recipients ───────────────────────────────────────────

    public function testThreadEndpointIncludesRecipientsForEachMessage(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');

        $root = $this->createRoot($userA, [$userB], 'pag-thr-recip-root');
        $reply = $this->createReply($userB, [$userA], 'pag-thr-recip-reply', $root);

        $this->authenticateAs($userA);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        foreach ($data['messages'] as $msg) {
            $this->assertArrayHasKey(
                'recipients',
                $msg,
                "Field 'recipients' missing on message '{$msg['subject']}' – frontend would show '?' in thread view"
            );
            $this->assertIsArray($msg['recipients']);
        }

        // Root: recipient is userB
        $rootMsg = $this->findInList($data['messages'], 'pag-thr-recip-root');
        $this->assertNotNull($rootMsg);
        $this->assertCount(1, $rootMsg['recipients']);
        $this->assertSame($userB->getFullName(), $rootMsg['recipients'][0]['name']);

        // Reply: recipient is userA
        $replyMsg = $this->findInList($data['messages'], 'pag-thr-recip-reply');
        $this->assertNotNull($replyMsg);
        $this->assertCount(1, $replyMsg['recipients']);
        $this->assertSame($userA->getFullName(), $replyMsg['recipients'][0]['name']);
    }

    public function testThreadEndpointIncludesRecipientsForDeepNestedReply(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');
        $userC = $this->getUser('user23@example.com');

        $root = $this->createRoot($userA, [$userB, $userC], 'pag-thr-deep-recip-root');
        $reply1 = $this->createReply($userB, [$userA], 'pag-thr-deep-recip-r1', $root);
        $reply2 = $this->createReplyWithParent($userA, [$userB], 'pag-thr-deep-recip-r2', $root, $reply1);

        $this->authenticateAs($userA);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(3, $data['messages']);

        // Every message in the thread must carry recipients
        foreach ($data['messages'] as $msg) {
            $this->assertArrayHasKey(
                'recipients',
                $msg,
                "Depth-2 reply '{$msg['subject']}' missing 'recipients' – shows '?' in frontend thread view"
            );
        }

        // Verify parentId chain is correct (needed for frontend tree-builder)
        $r2 = $this->findInList($data['messages'], 'pag-thr-deep-recip-r2');
        $this->assertSame($reply1->getId(), $r2['parentId']);
        $this->assertSame($root->getId(), $r2['threadId']);
    }

    public function testThreadEndpointRootWithMultipleRecipientsReturnsAll(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');
        $userC = $this->getUser('user23@example.com');

        $root = $this->createRoot($userA, [$userB, $userC], 'pag-thr-multi-recip-root');

        $this->authenticateAs($userA);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $rootMsg = $this->findInList($data['messages'], 'pag-thr-multi-recip-root');

        $this->assertNotNull($rootMsg);
        $this->assertCount(2, $rootMsg['recipients'], 'All recipients must be included in thread response');
        $recipientNames = array_column($rootMsg['recipients'], 'name');
        $this->assertContains($userB->getFullName(), $recipientNames);
        $this->assertContains($userC->getFullName(), $recipientNames);
    }

    // ── Conversations endpoint ────────────────────────────────────────────────

    public function testConversationsEndpointReturnsOnlyRoots(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');

        $root = $this->createRoot($userA, [$userB], 'pag-conv-roots-only-root');
        $this->createReply($userB, [$userA], 'pag-conv-roots-only-reply', $root);

        $this->authenticateAs($userA);
        $this->client->request('GET', '/api/messages/conversations');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $subjects = array_column($data['messages'], 'subject');

        $this->assertContains('pag-conv-roots-only-root', $subjects);
        $this->assertNotContains(
            'pag-conv-roots-only-reply',
            $subjects,
            'Conversations endpoint must only return thread roots (parent IS NULL)'
        );
    }

    public function testConversationsEndpointIncludesReplyCount(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');

        $root = $this->createRoot($userA, [$userB], 'pag-conv-replycount-root');
        $this->createReply($userB, [$userA], 'pag-conv-replycount-r1', $root);
        $this->createReply($userA, [$userB], 'pag-conv-replycount-r2', $root);

        $this->authenticateAs($userA);
        $this->client->request('GET', '/api/messages/conversations');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $rootMsg = $this->findInList($data['messages'], 'pag-conv-replycount-root');

        $this->assertNotNull($rootMsg);
        $this->assertSame(2, $rootMsg['replyCount']);
    }

    public function testConversationsEndpointIncludesRecipients(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');

        $this->createRoot($userA, [$userB], 'pag-conv-recip-root');

        $this->authenticateAs($userA);
        $this->client->request('GET', '/api/messages/conversations');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $rootMsg = $this->findInList($data['messages'], 'pag-conv-recip-root');

        $this->assertNotNull($rootMsg);
        $this->assertArrayHasKey(
            'recipients',
            $rootMsg,
            "Conversations endpoint must include 'recipients' – needed for 'Absender → Empfänger' format"
        );
        $this->assertCount(1, $rootMsg['recipients']);
        $this->assertSame($userB->getFullName(), $rootMsg['recipients'][0]['name']);
    }

    public function testConversationsEndpointVisibleToBothSenderAndRecipient(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');

        $root = $this->createRoot($userA, [$userB], 'pag-conv-both-sides-root');

        // Sender sees it
        $this->authenticateAs($userA);
        $this->client->request('GET', '/api/messages/conversations');
        $dataA = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertNotNull(
            $this->findInList($dataA['messages'], 'pag-conv-both-sides-root'),
            'Sender must see conversation in conversations list'
        );

        // Recipient sees it
        $this->authenticateAs($userB);
        $this->client->request('GET', '/api/messages/conversations');
        $dataB = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertNotNull(
            $this->findInList($dataB['messages'], 'pag-conv-both-sides-root'),
            'Recipient must see conversation in conversations list'
        );
    }

    // ── Conversations: hasUnreadReplies ───────────────────────────────────────

    public function testConversationsHasUnreadRepliesFalseWhenNoReplies(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $this->createRoot($sender, [$recipient], 'pag-conv-noreply-hasunread-root');

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages/conversations');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $msg = $this->findInList($data['messages'], 'pag-conv-noreply-hasunread-root');

        $this->assertNotNull($msg);
        $this->assertFalse($msg['hasUnreadReplies'], 'hasUnreadReplies must be false when no replies exist');
    }

    public function testConversationsHasUnreadRepliesTrueWhenRecipientHasUnreadReply(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-conv-unread-hasunread-root');
        $this->createReply($sender, [$recipient], 'pag-conv-unread-hasunread-reply', $root);

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages/conversations');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $msg = $this->findInList($data['messages'], 'pag-conv-unread-hasunread-root');

        $this->assertNotNull($msg);
        $this->assertTrue($msg['hasUnreadReplies'], 'hasUnreadReplies must be true when recipient has an unread reply');
    }

    public function testConversationsHasUnreadRepliesFalseAfterReplyIsRead(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-conv-readreply-hasunread-root');
        $reply = $this->createReply($sender, [$recipient], 'pag-conv-readreply-hasunread-reply', $root);

        $reply->markAsRead($recipient);
        $this->entityManager->flush();

        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages/conversations');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $msg = $this->findInList($data['messages'], 'pag-conv-readreply-hasunread-root');

        $this->assertNotNull($msg);
        $this->assertFalse($msg['hasUnreadReplies'], 'hasUnreadReplies must be false after recipient reads the reply');
    }

    public function testConversationsHasUnreadRepliesFalseForSenderViewingOwnReplies(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createRoot($sender, [$recipient], 'pag-conv-sender-hasunread-root');
        // Sender sends a reply to recipient — sender is NOT a recipient of their own reply,
        // so no unread-reply indicator should appear for sender.
        $this->createReply($sender, [$recipient], 'pag-conv-sender-hasunread-reply', $root);

        $this->authenticateAs($sender);
        $this->client->request('GET', '/api/messages/conversations');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $msg = $this->findInList($data['messages'], 'pag-conv-sender-hasunread-root');

        $this->assertNotNull($msg);
        $this->assertFalse($msg['hasUnreadReplies'], 'Sender must not see hasUnreadReplies=true for their own sent replies');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function getUser(string $email): User
    {
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
        self::assertNotNull($user, "Fixture-User '$email' nicht gefunden. Fixtures laden: --group=test");

        return $user;
    }

    private function authenticateAs(User $user): void
    {
        $token = $this->jwtManager->create($user);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $token);
    }

    /** @param User[] $recipients */
    private function createRoot(User $sender, array $recipients, string $subject): Message
    {
        $msg = new Message();
        $msg->setSender($sender);
        $msg->setSubject($subject);
        $msg->setContent('Test-Content');
        foreach ($recipients as $r) {
            $msg->addRecipient($r);
        }
        $this->entityManager->persist($msg);
        $this->entityManager->flush();

        return $msg;
    }

    /**
     * Creates a reply whose parent AND thread both point to $root.
     *
     * @param User[] $recipients
     */
    private function createReply(User $sender, array $recipients, string $subject, Message $root): Message
    {
        return $this->createReplyWithParent($sender, $recipients, $subject, $root, $root);
    }

    /**
     * Creates a reply with explicit parent. Thread always points to $root.
     *
     * @param User[] $recipients
     */
    private function createReplyWithParent(User $sender, array $recipients, string $subject, Message $root, Message $parent): Message
    {
        $msg = new Message();
        $msg->setSender($sender);
        $msg->setSubject($subject);
        $msg->setContent('Test-Reply-Content');
        $msg->setParent($parent);
        $msg->setThread($root);
        foreach ($recipients as $r) {
            $msg->addRecipient($r);
        }
        $this->entityManager->persist($msg);
        $this->entityManager->flush();

        return $msg;
    }

    /**
     * @param array<array<string, mixed>> $list
     *
     * @return array<string, mixed>|null
     */
    private function findInList(array $list, string $subject): ?array
    {
        foreach ($list as $item) {
            if (($item['subject'] ?? '') === $subject) {
                return $item;
            }
        }

        return null;
    }

    protected function tearDown(): void
    {
        $conn = $this->entityManager->getConnection();

        $conn->executeStatement(
            'UPDATE messages SET parent_id = NULL, thread_id = NULL WHERE subject LIKE "pag-test-%"'
        );
        $conn->executeStatement(
            'DELETE FROM message_recipients WHERE message_id IN (SELECT id FROM messages WHERE subject LIKE "pag-test-%")'
        );
        $conn->executeStatement('DELETE FROM messages WHERE subject LIKE "pag-test-%"');

        $this->entityManager->close();
        parent::tearDown();
        restore_exception_handler();
    }
}
