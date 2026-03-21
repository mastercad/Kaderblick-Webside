<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class GithubService
{
    private HttpClientInterface $httpClient;
    private string $githubToken;
    private string $repoOwner;
    private string $repoName;

    public function __construct(
        HttpClientInterface $httpClient,
        string $githubToken,
        string $githubRepoOwner,
        string $githubRepoName
    ) {
        $this->httpClient = $httpClient;
        $this->githubToken = $githubToken;
        $this->repoOwner = $githubRepoOwner;
        $this->repoName = $githubRepoName;
    }

    /**
     * @param array<int, string> $labels
     *
     * @return array<string, mixed>
     */
    public function createIssue(string $title, string $body, array $labels = []): array
    {
        $response = $this->httpClient->request('POST', "https://api.github.com/repos/{$this->repoOwner}/{$this->repoName}/issues", [
            'headers' => [
                'Authorization' => "token {$this->githubToken}",
                'Accept' => 'application/vnd.github.v3+json',
            ],
            'json' => [
                'title' => $title,
                'body' => $body,
                'labels' => $labels,
            ],
        ]);

        return $response->toArray();
    }

    /** @return array<string, mixed> */
    public function retrieveIssues(string $state = 'open'): array
    {
        $response = $this->httpClient->request('GET', "https://api.github.com/repos/{$this->repoOwner}/{$this->repoName}/issues", [
            'headers' => [
                'Authorization' => "token {$this->githubToken}",
                'Accept' => 'application/vnd.github.v3+json',
            ],
            'query' => [
                'state' => $state,
                'per_page' => 100,
            ],
        ]);

        return $response->toArray();
    }

    /** @return array<string, mixed> */
    public function addComment(int $issueNumber, string $body): array
    {
        $response = $this->httpClient->request(
            'POST',
            "https://api.github.com/repos/{$this->repoOwner}/{$this->repoName}/issues/{$issueNumber}/comments",
            [
                'headers' => [
                    'Authorization' => "token {$this->githubToken}",
                    'Accept' => 'application/vnd.github.v3+json',
                ],
                'json' => ['body' => $body],
            ]
        );

        return $response->toArray();
    }

    /** @return array<string, mixed> */
    public function closeIssue(int $issueNumber): array
    {
        $response = $this->httpClient->request(
            'PATCH',
            "https://api.github.com/repos/{$this->repoOwner}/{$this->repoName}/issues/{$issueNumber}",
            [
                'headers' => [
                    'Authorization' => "token {$this->githubToken}",
                    'Accept' => 'application/vnd.github.v3+json',
                ],
                'json' => ['state' => 'closed'],
            ]
        );

        return $response->toArray();
    }

    /** @return array<string, mixed> */
    public function reopenIssue(int $issueNumber): array
    {
        $response = $this->httpClient->request(
            'PATCH',
            "https://api.github.com/repos/{$this->repoOwner}/{$this->repoName}/issues/{$issueNumber}",
            [
                'headers' => [
                    'Authorization' => "token {$this->githubToken}",
                    'Accept' => 'application/vnd.github.v3+json',
                ],
                'json' => ['state' => 'open'],
            ]
        );

        return $response->toArray();
    }

    /** @return array<string, mixed> */
    public function getIssue(int $issueNumber): array
    {
        $response = $this->httpClient->request(
            'GET',
            "https://api.github.com/repos/{$this->repoOwner}/{$this->repoName}/issues/{$issueNumber}",
            [
                'headers' => [
                    'Authorization' => "token {$this->githubToken}",
                    'Accept' => 'application/vnd.github.v3+json',
                ],
            ]
        );

        return $response->toArray();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getIssueComments(int $issueNumber): array
    {
        $response = $this->httpClient->request(
            'GET',
            "https://api.github.com/repos/{$this->repoOwner}/{$this->repoName}/issues/{$issueNumber}/comments",
            [
                'headers' => [
                    'Authorization' => "token {$this->githubToken}",
                    'Accept' => 'application/vnd.github.v3+json',
                ],
                'query' => ['per_page' => 100],
            ]
        );

        return $response->toArray();
    }
}
