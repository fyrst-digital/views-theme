<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Twig;

use Fyrst\ViewsTheme\Twig\ViUtilities;
use PHPUnit\Framework\TestCase;
use Twig\Environment;
use Twig\Loader\ArrayLoader;

final class ViBlockTest extends TestCase
{
    public function testRendersBodyWhenOuterBlocksMissing(): void
    {
        $html = $this->createTwig([
            't.html.twig' => '{% vi_block accountType %}default{% endvi_block %}',
        ])->render('t.html.twig');

        self::assertSame('default', $html);
    }

    public function testRendersBodyWhenOuterBlocksIsNotBlockStack(): void
    {
        $html = $this->createTwig([
            't.html.twig' => '{% vi_block accountType %}default{% endvi_block %}',
        ])->render('t.html.twig', [
            'outerBlocks' => new \stdClass(),
        ]);

        self::assertSame('default', $html);
    }

    public function testEmptyBodyRendersNothing(): void
    {
        $html = $this->createTwig([
            't.html.twig' => '{% vi_block append %}{% endvi_block %}',
        ])->render('t.html.twig');

        self::assertSame('', $html);
    }

    public function testNestedBlockEndblockDoesNotCloseViBlock(): void
    {
        $html = $this->createTwig([
            't.html.twig' => '{% vi_block x %}{% block y %}inner{% endblock %}{% endvi_block %}',
        ])->render('t.html.twig');

        self::assertSame('inner', $html);
    }

    /**
     * @param array<string, string> $templates
     */
    private function createTwig(array $templates): Environment
    {
        $twig = new Environment(new ArrayLoader($templates));
        $twig->addExtension(new ViUtilities());

        return $twig;
    }
}
