<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Twig;

use Fyrst\ViewsTheme\Twig\ViCvaSlot;
use Fyrst\ViewsTheme\Twig\ViUtilities;
use PHPUnit\Framework\TestCase;
use Symfony\UX\TwigComponent\ComponentAttributes;
use Twig\Environment;
use Twig\Error\RuntimeError;
use Twig\Loader\ArrayLoader;
use Twig\Runtime\EscaperRuntime;

final class ViCvaFromFileTest extends TestCase
{
    public function testLoadsSiblingCvaFileViaExplicitHtmlTemplate(): void
    {
        $twig = $this->createTwig([
            '@ViewsTheme/components/Alert.html.twig' => '{% set cx = vi_cva_from_file(cva, _self) %}{{ cx.root.apply({ type: type }) }}',
            '@ViewsTheme/components/Alert.cva.twig' => <<<'TWIG'
{
    root: {
        base: 'vi-alert',
        variants: {
            type: { info: 'alert-info', danger: 'alert-danger' },
        },
    },
    icon: { base: 'vi-alert__icon' },
}
TWIG,
        ]);

        $html = $twig->render('@ViewsTheme/components/Alert.html.twig', [
            'cva' => [],
            'type' => 'info',
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('vi-alert alert-info', $html);
    }

    public function testMergesCallerOverrides(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% set cx = vi_cva_from_file(cva, "comp.html.twig") %}{{ cx.root.apply() }}',
            'comp.cva.twig' => "{ root: { base: 'base-a' }, label: { base: 'label-a' } }",
        ]);

        $html = $twig->render('comp.html.twig', [
            'cva' => [
                'root' => ['base' => 'base-override'],
            ],
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('base-override', $html);
    }

    public function testDynamicExpressionsUseComponentContext(): void
    {
        $twig = $this->createTwig([
            'box.html.twig' => '{% set cx = vi_cva_from_file(cva, "box.html.twig") %}{{ cx.root.apply() }}',
            'box.cva.twig' => "{ root: { base: 'vi-box layout-' ~ layout } }",
        ]);

        $html = $twig->render('box.html.twig', [
            'cva' => [],
            'layout' => 'standard',
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('vi-box layout-standard', $html);
    }

    public function testShortNameResolvesUnderViewsThemeComponents(): void
    {
        $twig = $this->createTwig([
            'caller.html.twig' => '{% set cx = vi_cva_from_file(cva, "Alert") %}{{ cx.root.apply() }}',
            '@ViewsTheme/components/Alert.cva.twig' => "{ root: { base: 'from-short-name' } }",
        ]);

        $html = $twig->render('caller.html.twig', [
            'cva' => [],
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('from-short-name', $html);
    }

    public function testBindsRootAndNestedAttributeClasses(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% set cx = vi_cva_from_file(cva, "comp.cva.twig") %}{{ cx.root.apply() }}|{{ cx.icon.apply() }}',
            'comp.cva.twig' => "{ root: { base: 'root-base' }, icon: { base: 'icon-base' } }",
        ]);

        $attributes = new ComponentAttributes([
            'class' => 'root-extra',
            'icon:class' => 'icon-extra',
        ], $twig->getRuntime(EscaperRuntime::class));

        $html = $twig->render('comp.html.twig', [
            'cva' => [],
            'attributes' => $attributes,
        ]);

        self::assertSame('root-base root-extra|icon-base icon-extra', $html);
    }

    public function testReturnsViCvaSlotMap(): void
    {
        $utils = new ViUtilities();
        $twig = new Environment(new ArrayLoader([
            'x.cva.twig' => "{ root: { base: 'r' }, label: { base: 'l' } }",
        ]));
        $twig->addExtension($utils);

        $context = [
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ];

        $map = $utils->cvaFromFile($twig, $context, [], 'x.cva.twig');

        self::assertArrayHasKey('root', $map);
        self::assertArrayHasKey('label', $map);
        self::assertInstanceOf(ViCvaSlot::class, $map['root']);
        self::assertSame('r', $map['root']->apply());
        self::assertSame('l', $map['label']->apply());
    }

    public function testMissingFileThrows(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% set cx = vi_cva_from_file(cva, "missing.cva.twig") %}{{ cx.root.apply() }}',
        ]);

        $this->expectException(RuntimeError::class);
        $this->expectExceptionMessage('not found');

        $twig->render('comp.html.twig', [
            'cva' => [],
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);
    }

    public function testAllowsLeadingCommentsInCvaFile(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% set cx = vi_cva_from_file(cva, "comp.cva.twig") %}{{ cx.root.apply() }}',
            'comp.cva.twig' => "{# defaults #}\n{ root: { base: 'commented' } }\n",
        ]);

        $html = $twig->render('comp.html.twig', [
            'cva' => [],
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('commented', $html);
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
