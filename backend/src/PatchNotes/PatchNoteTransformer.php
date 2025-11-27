<?php

declare(strict_types=1);

namespace App\PatchNotes;

use App\PatchNotes\Contract\PatchNoteAnalyzerInterface;
use App\PatchNotes\Contract\PatchNoteDetectorInterface;
use App\PatchNotes\Contract\PatchNoteFormatterInterface;
use App\PatchNotes\Contract\PatchNoteParserInterface;

/**
 * Façade pour tout brancher proprement.
 */
final class PatchNoteTransformer
{
    public function __construct(
        private PatchNoteDetectorInterface $detector,
        private PatchNoteParserInterface $parser,
        private PatchNoteAnalyzerInterface $analyzer,
        private PatchNoteFormatterInterface $formatter
    ) {
    }

    /**
     * Transforme un texte brut en Markdown.
     * Lance une InvalidArgumentException si le texte ne ressemble pas à une patch note.
     */
    public function transform(string $text): string
    {
        if (!$this->detector->isPatchNote($text)) {
            throw new \InvalidArgumentException('Provided text does not look like a patch note.');
        }

        $note = $this->parser->parse($text);
        $analysis = $this->analyzer->analyze($note->getChanges());

        return $this->formatter->format($note, $analysis);
    }
}
