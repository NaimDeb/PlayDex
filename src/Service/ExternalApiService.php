<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class ExternalApiService
{
    private $client;
    private $params;

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


    public function getIgdbGames(int $limit, int $offset = 0)
    {
    
        $body = '
        fields id, name, platforms.*, involved_companies.company.name, first_release_date, genres.id, cover.url;
        where game_type = 0;
        limit ' . $limit . ';
        offset ' . $offset . ';';


        $response = $this->client->request('POST', 'https://api.igdb.com/v4/games', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->params->get('IGDB_API_KEY'),
                'Client-ID' => $this->params->get('IGDB_CLIENT_ID'),
                'Content-Type' => 'application/json',
                'Accept' => '*/*'
            ],
            'body' => $body,

        ]);

        $content = $response->getContent();

        // todo : Error handling


        return json_decode($content, true);
        
        // $contentType = $response->getHeaders()['content-type'][0];


        // return $response->then(
        //     function ($response) {
        //         return $response->toArray(); // Handle the successful response
        //     },
        //     function ($error) {
        //         // Handle any errors
        //         throw new \Exception('The IGDB /games API request with a limit of ' . $limit . ' and an offset of ' . $offset . '  failed: ' . $error->getMessage());
        //     }
        // );
    }

    public function getNumberOfIgdbGames()
    {

        $body = '
        fields id, name, platforms.*, involved_companies.company.name, first_release_date, genres.id, artworks.url;
        where game_type = 0;
        limit 1;';

        $response = $this->client->request('POST', 'https://api.igdb.com/v4/games', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->params->get('IGDB_API_KEY'),
                'Client-ID' => $this->params->get('IGDB_CLIENT_ID'),
                'Content-Type' => 'application/json',
                'Accept' => '*/*'
            ],
            'body' => $body,

        ]);

        $contentType = $response->getHeaders()['x-count'][0];
        return $contentType;

    }
}
