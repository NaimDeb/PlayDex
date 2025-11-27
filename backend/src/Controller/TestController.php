<?php

namespace App\Controller;

use App\PatchNotes\Bootstrap\PatchNoteBootstrap;
use App\Service\TestService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class TestController extends AbstractController
{
    private TestService $testService;

    public function __construct(TestService $testService)
    {
        $this->testService = $testService;
    }

    #[Route('/test', name: 'test_page', methods: ['GET', 'POST'])]
    public function testPage(Request $request): Response
    {
        $input = '';
        $output = '';

        if ($request->isMethod('POST')) {
            $input = $request->request->get('input', '');
            // Call the service to process the input
            $output = $this->testService->processInput($input);
        }

        return $this->render('test.html.twig', [
            'input' => $input,
            'output' => $output,
        ]);
    }

    #[Route('/patch-notes/transform', name: 'patch_notes_transform', methods: ['GET', 'POST'])]
    public function transformPatchNotes(Request $request): Response
    {
        $input = '';
        $output = '';
        $error = '';

        if ($request->isMethod('POST')) {
            $input = $request->request->get('patchnote', '');

            try {
                $transformer = PatchNoteBootstrap::createDefaultTransformer();
                $output = $transformer->transform($input);
            } catch (\InvalidArgumentException $e) {
                $error = $e->getMessage();
            }
        }

        return $this->render('patch_notes.html.twig', [
            'input' => $input,
            'output' => $output,
            'error' => $error,
        ]);
    }
}
