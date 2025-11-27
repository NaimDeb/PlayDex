<?php

declare(strict_types=1);

namespace App\PatchNotes\Bootstrap;

use App\PatchNotes\Analyzer\PatchNoteAnalyzer;
use App\PatchNotes\Detector\SimplePatchNoteDetector;
use App\PatchNotes\Extractor\SimpleTitleExtractor;
use App\PatchNotes\Formatter\PatchNoteMarkdownFormatter;
use App\PatchNotes\Guesser\ChangeTypeGuesser;
use App\PatchNotes\Normalizer\CategoryNormalizer;
use App\PatchNotes\Parser\PatchNoteParser;
use App\PatchNotes\PatchNoteTransformer;

/**
 * Petit helper pour bootstrapper avec la config par défaut.
 */
final class PatchNoteBootstrap
{
    public static function createDefaultTransformer(): PatchNoteTransformer
    {
        $detector = new SimplePatchNoteDetector();
        $titleExtractor = new SimpleTitleExtractor();
        $categoryNormalizer = new CategoryNormalizer();
        $changeTypeGuesser = new ChangeTypeGuesser();
        $parser = new PatchNoteParser($titleExtractor, $categoryNormalizer, $changeTypeGuesser);
        $analyzer = new PatchNoteAnalyzer();
        $formatter = new PatchNoteMarkdownFormatter();

        return new PatchNoteTransformer(
            detector: $detector,
            parser: $parser,
            analyzer: $analyzer,
            formatter: $formatter
        );
    }
}
