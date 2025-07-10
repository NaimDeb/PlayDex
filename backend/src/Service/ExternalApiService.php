<?php

namespace App\Service;

use Exception;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class ExternalApiService
{
    private $client;
    private $params;
    private const IGDB_API_URL = 'https://api.igdb.com/v4';

    public function __construct(HttpClientInterface $client, ParameterBagInterface $params)
    {
        $this->client = $client;
        $this->params = $params;
    }

    public function getSteamData($gameId)
    {
        $response = $this->client->request('GET', 'https://api.steampowered.com/...', [
            'headers' => [
                'key' => $this->params->get('STEAM_API_KEY'),
            ],
        ]);

        return $response->toArray(); // Retourne la réponse sous forme de tableau
    }


    private function getIgdbHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->params->get('IGDB_ACCESS_TOKEN'),
            'Client-ID' => $this->params->get('TWITCH_CLIENT_ID'),
            'Content-Type' => 'application/json',
            'Accept' => '*/*'
        ];
    }

    private function makeIgdbRequest(string $endpoint, string $body)
    {
        $response = $this->client->request('POST', self::IGDB_API_URL . $endpoint, [
            'headers' => $this->getIgdbHeaders(),
            'body' => $body,
        ]);

        return $response;
    }

    private function getCount(string $endpoint, string $whereClause = ''): int
    {
        $body = "count;\n" . $whereClause . ";\nlimit 1;";
        $response = $this->makeIgdbRequest($endpoint, $body);
        return (int) $response->getHeaders()['x-count'][0];
    }


    public function getIgdbGames(int $limit, int $offset = 0, ?int $from = null)
    {
        $body = $this->buildQueryBody([
            'fields' => 'id, name, platforms.*, summary, involved_companies.company.name, first_release_date, genres.id, cover.url',
            'where' => 'game_type = 0' . ($from ? ' & updated_at >= ' . $from : ''),
            'limit' => $limit,
            'offset' => $offset
        ]);


        $response = $this->makeIgdbRequest('/games', $body);
        return json_decode($response->getContent(), true);
    }

    public function getIgdbExtensions(int $limit, int $offset = 0, ?int $from = null)
    {
        $body = $this->buildQueryBody([
            'fields' => 'id, name, platforms.*, parent_game, involved_companies.company.name, first_release_date, genres.id, cover.url',
            'where' => 'game_type = (1,2,4,6,7)' . ($from ? ' & updated_at >= ' . $from : ''),
            'limit' => $limit,
            'offset' => $offset
        ]);

        try {
            $response = $this->makeIgdbRequest('/games', $body);
            return json_decode($response->getContent(), true);
        } catch (\Exception $e) {
            // Log or handle the error
            throw new \Exception('IGDB API Error: ' . $e->getMessage() . ' - Query: ' . $body);
        }
    }

    public function getIgdbGenres(int $limit, int $offset = 0, ?int $from = null)
    {

        if ($from == null) {
            $body = $this->buildQueryBody([
                'fields' => 'id, name',
                'limit' => $limit,
                'offset' => $offset
            ]);
        } else {
            $body = $this->buildQueryBody([
                'fields' => 'id, name',
                'where' => 'updated_at >= ' . $from,
                'limit' => $limit,
                'offset' => $offset
            ]);
        }

        $response = $this->makeIgdbRequest('/genres', $body);
        return json_decode($response->getContent(), true);
    }

    public function getIgdbCompanies(int $limit, int $offset = 0, ?int $from = null)
    {
        if ($from == null) {
            $body = $this->buildQueryBody([
                'fields' => 'id, name',
                'limit' => $limit,
                'offset' => $offset
            ]);
        } else {
            $body = $this->buildQueryBody([
                'fields' => 'id, name',
                'where' => 'updated_at >= ' . $from,
                'limit' => $limit,
                'offset' => $offset
            ]);
        }

        $response = $this->makeIgdbRequest('/companies', $body);
        return json_decode($response->getContent(), true);
    }

    private function buildQueryBody(array $params): string
    {
        $query = '';
        if (isset($params['fields'])) $query .= "fields {$params['fields']};\n";
        if (isset($params['where'])) $query .= "where {$params['where']};\n";
        if (isset($params['limit'])) $query .= "limit {$params['limit']};\n";
        if (isset($params['offset'])) $query .= "offset {$params['offset']};";
        return $query;
    }

    // Todo : Can all be merged into one function

    public function getNumberOfIgdbGames(?int $from): int
    {
        return $this->getCount('/games', 'where game_type = 0' . ($from ? ' & updated_at >= ' . $from : ''));
    }

    public function getNumberOfIgdbExtensions(?int $from): int
    {
        return $this->getCount('/games', 'where game_type = (1,2,4,6,7)' . ($from ? ' & updated_at >= ' . $from : ''));
    }

    public function getNumberOfIgdbGenres(?int $from): int
    {
        return $this->getCount('/genres', $from ? 'where updated_at >= ' . $from : '');
    }

    public function getNumberOfIgdbCompanies(?int $from): int
    {
        return $this->getCount('/companies', $from ? 'where updated_at >= ' . $from : '');
    }
}
