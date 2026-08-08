<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Twig;

use Fyrst\ViewsTheme\Twig\ViUtilities;
use PHPUnit\Framework\TestCase;
use Symfony\UX\TwigComponent\ComponentAttributes;
use Twig\Environment;
use Twig\Loader\ArrayLoader;
use Twig\Runtime\EscaperRuntime;

final class ViAttrsTest extends TestCase
{
    public function testDefineAttrsAndResolve(): void
    {
        $twig = $this->createTwig([
            't.html.twig' => <<<'TWIG'
{% do vi_define_attrs(['submit', 'field']) %}
{{ vi_attrs('submit').all()|json_encode|raw }}
TWIG,
        ]);
        $escaper = $twig->getRuntime(EscaperRuntime::class);

        $html = $twig->render('t.html.twig', [
            'attributes' => new ComponentAttributes([
                'submit:type' => 'submit',
                'submit:icon' => 'ticket',
                'field:name' => 'code',
            ], $escaper),
        ]);

        self::assertSame('{"type":"submit","icon":"ticket"}', $html);
    }

    public function testAttrsWalksOuterScope(): void
    {
        $twig = $this->createTwig();
        $escaper = $twig->getRuntime(EscaperRuntime::class);
        $parentSubmit = new ComponentAttributes(['icon' => 'ticket'], $escaper);

        $bag = $twig->getExtension(ViUtilities::class)->attrs($twig, [
            '__vi_attrs' => [
                'label' => new ComponentAttributes([], $escaper),
            ],
            'outerScope' => [
                '__vi_attrs' => [
                    'submit' => $parentSubmit,
                ],
            ],
        ], 'submit');

        self::assertSame($parentSubmit, $bag);
    }

    public function testDefineCvaInlineAndViClass(): void
    {
        $twig = $this->createTwig([
            't.html.twig' => <<<'TWIG'
{% do vi_define_cva({ root: { base: 'vi-root' }, submit: { base: 'vi-submit' } }) %}
{{ vi_class('submit') }}
TWIG,
        ]);

        $html = $twig->render('t.html.twig', [
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('vi-submit', $html);
    }

    public function testDefineCvaExportListLimitsViClass(): void
    {
        $twig = $this->createTwig([
            't.html.twig' => <<<'TWIG'
{% do vi_define_cva({
    root: { base: 'vi-root' },
    submit: { base: 'vi-submit' },
    hidden: { base: 'vi-hidden' },
}, ['root', 'submit']) %}
{{ vi_class('submit') }}|{{ vi_class('hidden') }}
TWIG,
        ]);

        $html = $twig->render('t.html.twig', [
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('vi-submit|', $html);
    }

    public function testViClassVariantsAtUseSite(): void
    {
        $twig = $this->createTwig([
            't.html.twig' => <<<'TWIG'
{% do vi_define_cva({
    root: {
        base: 'vi-btn',
        variants: { size: { sm: 'btn-sm', md: 'btn-md' } },
    },
}) %}
{{ vi_class('root', { size: size }) }}
TWIG,
        ]);

        $html = $twig->render('t.html.twig', [
            'size' => 'sm',
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('vi-btn btn-sm', $html);
    }

    public function testDefineCvaFromSiblingFileWithOverrides(): void
    {
        $twig = $this->createTwig([
            '@ViewsTheme/components/Alert.html.twig' => <<<'TWIG'
{% do vi_define_cva(cva) %}
{{ vi_class('root', { type: type }) }}
TWIG,
            '@ViewsTheme/components/Alert.cva.twig' => <<<'TWIG'
{
    root: {
        base: 'vi-alert',
        variants: {
            type: { info: 'alert-info', danger: 'alert-danger' },
        },
    },
}
TWIG,
        ]);

        $html = $twig->render('@ViewsTheme/components/Alert.html.twig', [
            'cva' => [
                'root' => ['base' => 'vi-alert custom'],
            ],
            'type' => 'info',
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('vi-alert custom alert-info', $html);
    }

    public function testDefineCvaOptionsFileAndClasses(): void
    {
        $twig = $this->createTwig([
            't.html.twig' => <<<'TWIG'
{% do vi_define_cva(cva, { file: 'Alert', classes: ['root'] }) %}
{{ vi_class('root') }}|{{ vi_class('icon') }}
TWIG,
            '@ViewsTheme/components/Alert.cva.twig' => "{ root: { base: 'r' }, icon: { base: 'i' } }",
        ]);

        $html = $twig->render('t.html.twig', [
            'cva' => [],
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('r|', $html);
    }

    public function testClassMissingReturnsEmpty(): void
    {
        $twig = $this->createTwig();
        self::assertSame('', $twig->getExtension(ViUtilities::class)->class([], 'x'));
    }

    public function testRootClassMergedIntoViClassAndStrippedFromAttributes(): void
    {
        $twig = $this->createTwig([
            't.html.twig' => <<<'TWIG'
{% do vi_define_cva({ root: { base: 'vi-comment meddl' } }) %}
{{ vi_class('root') }}|{{ attributes.all()|json_encode|raw }}
TWIG,
        ]);
        $escaper = $twig->getRuntime(EscaperRuntime::class);

        $html = $twig->render('t.html.twig', [
            'attributes' => new ComponentAttributes([
                'class' => 'vi-comment mt-2',
                'data-x' => '1',
            ], $escaper),
        ]);

        self::assertSame('vi-comment meddl mt-2|{"data-x":"1"}', $html);
    }

    public function testNestedSlotClassMergedAndStripped(): void
    {
        $twig = $this->createTwig([
            't.html.twig' => <<<'TWIG'
{% do vi_define_cva({ root: { base: 'vi-root' }, comment: { base: 'vi-comment meddl' } }) %}
{{ vi_class('comment') }}|{{ attributes.all()|json_encode|raw }}
TWIG,
        ]);
        $escaper = $twig->getRuntime(EscaperRuntime::class);

        $html = $twig->render('t.html.twig', [
            'attributes' => new ComponentAttributes([
                'comment:class' => 'vi-comment mt-2',
                'data-x' => '1',
            ], $escaper),
        ]);

        self::assertSame('vi-comment meddl mt-2|{"data-x":"1"}', $html);
    }

    public function testClassWalksOuterScopeExports(): void
    {
        $twig = $this->createTwig([
            'child.html.twig' => '{{ vi_class("submit") }}',
        ]);

        // Simulate parent export via context outerScope (no component stack in unit test)
        $parentTwig = $this->createTwig([
            'parent.html.twig' => <<<'TWIG'
{% do vi_define_cva({ submit: { base: 'vi-submit' } }, ['submit']) %}
{% include 'child.html.twig' %}
TWIG,
            'child.html.twig' => '{{ vi_class("submit") }}',
        ]);

        // include shares context so __vi_classes is visible
        $html = $parentTwig->render('parent.html.twig', [
            'attributes' => new ComponentAttributes([], $parentTwig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('vi-submit', $html);
    }

    /**
     * @param array<string, string> $templates
     */
    private function createTwig(array $templates = ['noop.html.twig' => '']): Environment
    {
        $twig = new Environment(new ArrayLoader($templates));
        $twig->addExtension(new ViUtilities());

        return $twig;
    }
}
