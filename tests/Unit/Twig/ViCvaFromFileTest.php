<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Twig;

use Fyrst\ViewsTheme\Twig\ViUtilities;
use PHPUnit\Framework\TestCase;
use Symfony\UX\TwigComponent\ComponentAttributes;
use Twig\Environment;
use Twig\Error\RuntimeError;
use Twig\Loader\ArrayLoader;
use Twig\Runtime\EscaperRuntime;

final class ViCvaFromFileTest extends TestCase
{
    public function testLoadsSiblingCvaFile(): void
    {
        $twig = $this->createTwig([
            '@ViewsTheme/components/Alert.html.twig' => '{% do vi_define_cva(cva) %}{{ vi_class("root", { type: type }) }}',
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
            'comp.html.twig' => '{% do vi_define_cva(cva, "comp.html.twig") %}{{ vi_class("root") }}',
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

    public function testStringSlotOverrideReplacesBaseAndKeepsVariants(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% do vi_define_cva(cva, "comp.html.twig") %}{{ vi_class("root", { size: size }) }}',
            'comp.cva.twig' => <<<'TWIG'
{
    root: {
        base: 'base-a',
        variants: {
            size: { sm: 'is-sm' },
        },
    },
}
TWIG,
        ]);

        $html = $twig->render('comp.html.twig', [
            'cva' => [
                'root' => 'd-flex gap-2',
            ],
            'size' => 'sm',
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('d-flex gap-2 is-sm', $html);
    }

    public function testDynamicExpressionsUseComponentContext(): void
    {
        $twig = $this->createTwig([
            'box.html.twig' => '{% do vi_define_cva(cva, "box.html.twig") %}{{ vi_class("root") }}',
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
            'caller.html.twig' => '{% do vi_define_cva(cva, "Alert") %}{{ vi_class("root") }}',
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
            'comp.html.twig' => '{% do vi_define_cva(cva, "comp.cva.twig") %}{{ vi_class("root") }}|{{ vi_class("icon") }}',
            'comp.cva.twig' => "{ root: { base: 'root-base' }, icon: { base: 'icon-base' } }",
        ]);

        $html = $twig->render('comp.html.twig', [
            'cva' => [],
            'attributes' => new ComponentAttributes([
                'class' => 'root-extra',
                'icon:class' => 'icon-extra',
            ], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('root-base root-extra|icon-base icon-extra', $html);
    }

    public function testCallerBaseReplacesRootClassExtra(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% do vi_define_cva(cva, "comp.html.twig") %}{{ vi_class("root") }}',
            'comp.cva.twig' => "{ root: { base: 'root-base' } }",
        ]);

        $render = function (array $cva) use ($twig): string {
            return $twig->render('comp.html.twig', [
                'cva' => $cva,
                'attributes' => new ComponentAttributes([
                    'class' => 'root-extra',
                ], $twig->getRuntime(EscaperRuntime::class)),
            ]);
        };

        self::assertSame('meddl', $render(['root' => ['base' => 'meddl']]));
        self::assertSame('', $render(['root' => ['base' => '']]));
    }

    public function testCallerBaseReplacesNestedExtraAndKeepsUntouchedSlot(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% do vi_define_cva(cva, "comp.html.twig") %}{{ vi_class("root") }}|{{ vi_class("icon") }}',
            'comp.cva.twig' => "{ root: { base: 'root-base' }, icon: { base: 'icon-base' } }",
        ]);

        $html = $twig->render('comp.html.twig', [
            'cva' => [
                'icon' => ['base' => 'icon-override'],
            ],
            'attributes' => new ComponentAttributes([
                'class' => 'root-extra',
                'icon:class' => 'icon-extra',
            ], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('root-base root-extra|icon-override', $html);
    }

    public function testVariantsOnlyOverrideStillAppendsExtras(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% do vi_define_cva(cva, "comp.html.twig") %}{{ vi_class("root", { size: size }) }}',
            'comp.cva.twig' => <<<'TWIG'
{
    root: {
        base: 'root-base',
        variants: {
            size: { sm: 'is-sm' },
        },
    },
}
TWIG,
        ]);

        $html = $twig->render('comp.html.twig', [
            'cva' => [
                'root' => [
                    'variants' => [
                        'size' => ['lg' => 'is-lg'],
                    ],
                ],
            ],
            'size' => 'lg',
            'attributes' => new ComponentAttributes([
                'class' => 'root-extra',
            ], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('root-base is-lg root-extra', $html);
    }

    public function testStringSlotOverrideReplacesClassExtra(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% do vi_define_cva(cva, "comp.html.twig") %}{{ vi_class("root") }}',
            'comp.cva.twig' => "{ root: { base: 'root-base' } }",
        ]);

        $html = $twig->render('comp.html.twig', [
            'cva' => [
                'root' => 'meddl',
            ],
            'attributes' => new ComponentAttributes([
                'class' => 'root-extra',
            ], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('meddl', $html);
    }

    public function testMissingCvaFileThrows(): void
    {
        $twig = $this->createTwig([
            'comp.html.twig' => '{% do vi_define_cva(cva, "missing.cva.twig") %}{{ vi_class("root") }}',
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
            'comp.html.twig' => '{% do vi_define_cva(cva, "comp.cva.twig") %}{{ vi_class("root") }}',
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
