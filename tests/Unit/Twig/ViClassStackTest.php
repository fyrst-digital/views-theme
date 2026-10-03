<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Twig;

use Fyrst\ViewsTheme\Twig\ViUtilities;
use PHPUnit\Framework\TestCase;
use Symfony\UX\TwigComponent\ComponentAttributes;
use Symfony\UX\TwigComponent\ComponentStack;
use Symfony\UX\TwigComponent\MountedComponent;
use Twig\Environment;
use Twig\Loader\ArrayLoader;
use Twig\Runtime\EscaperRuntime;

/**
 * Lexical-first vi_class stack resolution (outer CVA slot wins for block overrides).
 */
final class ViClassStackTest extends TestCase
{
    public function testViClassFromParentTemplateUsesParentSlotWhileChildIsCurrent(): void
    {
        [$twig, $stack, $escaper] = $this->createStackTwig([
            'Navigation/Drawer.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({ title: { base: 'parent-title' }, root: { base: 'parent-root' } }) %}
{% endif %}
{% if call %}{{ vi_class(slot) }}{% endif %}
TWIG,
            'Drawer/Header.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({
    title: { base: 'child-title' },
    root: { base: 'child-root' },
    body: { base: 'child-body' },
}) %}
{% endif %}
{% if call %}{{ vi_class(slot) }}{% endif %}
TWIG,
        ]);

        $this->pushComponent($stack, 'Navigation:Drawer', $escaper);
        $twig->render('Navigation/Drawer.html.twig', $this->ctx($escaper, define: true));

        $this->pushComponent($stack, 'Drawer:Header', $escaper);
        $twig->render('Drawer/Header.html.twig', $this->ctx($escaper, define: true));

        $html = $twig->render('Navigation/Drawer.html.twig', $this->ctx($escaper, call: true, slot: 'title'));

        self::assertSame('parent-title', $html);
    }

    public function testViClassFromChildTemplateUsesChildSlots(): void
    {
        [$twig, $stack, $escaper] = $this->createStackTwig([
            'Navigation/Drawer.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({ title: { base: 'parent-title' }, root: { base: 'parent-root' } }) %}
{% endif %}
TWIG,
            'Drawer/Header.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({
    title: { base: 'child-title' },
    root: { base: 'child-root' },
    body: { base: 'child-body' },
}) %}
{% endif %}
{% if call %}{{ vi_class(slot) }}{% endif %}
TWIG,
        ]);

        $this->pushComponent($stack, 'Navigation:Drawer', $escaper);
        $twig->render('Navigation/Drawer.html.twig', $this->ctx($escaper, define: true));

        $this->pushComponent($stack, 'Drawer:Header', $escaper);
        $twig->render('Drawer/Header.html.twig', $this->ctx($escaper, define: true));

        $title = $twig->render('Drawer/Header.html.twig', $this->ctx($escaper, call: true, slot: 'title'));
        $root = $twig->render('Drawer/Header.html.twig', $this->ctx($escaper, call: true, slot: 'root'));

        self::assertSame('child-title', $title);
        self::assertSame('child-root', $root);
    }

    public function testChildOnlySlotIsEmptyWhenCalledFromParentTemplate(): void
    {
        [$twig, $stack, $escaper] = $this->createStackTwig([
            'Navigation/Drawer.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({ title: { base: 'parent-title' } }) %}
{% endif %}
{% if call %}{{ vi_class(slot) }}{% endif %}
TWIG,
            'Drawer/Header.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({
    title: { base: 'child-title' },
    body: { base: 'child-body' },
}) %}
{% endif %}
TWIG,
        ]);

        $this->pushComponent($stack, 'Navigation:Drawer', $escaper);
        $twig->render('Navigation/Drawer.html.twig', $this->ctx($escaper, define: true));

        $this->pushComponent($stack, 'Drawer:Header', $escaper);
        $twig->render('Drawer/Header.html.twig', $this->ctx($escaper, define: true));

        $html = $twig->render('Navigation/Drawer.html.twig', $this->ctx($escaper, call: true, slot: 'body'));

        self::assertSame('', $html);
    }

    public function testOmittedRootDoesNotUseHostSlot(): void
    {
        [$twig, $stack, $escaper] = $this->createStackTwig([
            'Navigation/Drawer.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({ root: { base: 'parent-root' }, title: { base: 'parent-title' } }) %}
{% endif %}
TWIG,
            'Drawer/Header.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({
    title: { base: 'child-title' },
    root: { base: 'child-root' },
}, ['title']) %}
{% endif %}
{% if call %}{{ vi_class(slot) }}{% endif %}
TWIG,
        ]);

        $this->pushComponent($stack, 'Navigation:Drawer', $escaper);
        $twig->render('Navigation/Drawer.html.twig', $this->ctx($escaper, define: true));

        $hostClasses = $stack->getCurrentComponent()?->getExtraMetadata('vi_classes');
        $spread = [
            '__vi_classes' => $hostClasses,
            'outerScope' => ['__vi_classes' => $hostClasses],
        ];

        $this->pushComponent($stack, 'Drawer:Header', $escaper);
        $twig->render('Drawer/Header.html.twig', $this->ctx($escaper, define: true) + $spread);

        $html = $twig->render('Drawer/Header.html.twig', $this->ctx($escaper, call: true, slot: 'root') + $spread);

        self::assertSame('', $html);
    }

    public function testStringRootOverrideDoesNotUseHostSlot(): void
    {
        [$twig, $stack, $escaper] = $this->createStackTwig([
            'Navigation/Drawer.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({ root: { base: 'parent-root' } }) %}
{% endif %}
TWIG,
            'Drawer/Header.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva(cva) %}
{% endif %}
{% if call %}{{ vi_class('root') }}{% endif %}
TWIG,
            'Drawer/Header.cva.twig' => "{ root: { base: 'child-root' } }",
        ]);

        $this->pushComponent($stack, 'Navigation:Drawer', $escaper);
        $twig->render('Navigation/Drawer.html.twig', $this->ctx($escaper, define: true));

        $hostClasses = $stack->getCurrentComponent()?->getExtraMetadata('vi_classes');
        $spread = [
            '__vi_classes' => $hostClasses,
            'outerScope' => ['__vi_classes' => $hostClasses],
            'cva' => ['root' => 'd-flex gap-2'],
        ];

        $this->pushComponent($stack, 'Drawer:Header', $escaper);
        $twig->render('Drawer/Header.html.twig', $this->ctx($escaper, define: true) + $spread);

        $html = $twig->render('Drawer/Header.html.twig', $this->ctx($escaper, call: true) + $spread);

        self::assertSame('d-flex gap-2', $html);
    }

    public function testSecondDefineOnSameMountKeepsEarlierSlots(): void
    {
        [$twig, $stack, $escaper] = $this->createStackTwig([
            'Host/A.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({ root: { base: 'first-root' } }) %}
{% endif %}
{% if call %}{{ vi_class(slot) }}{% endif %}
TWIG,
            'Host/B.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_cva({ label: { base: 'second-label' } }) %}
{% endif %}
{% if call %}{{ vi_class(slot) }}{% endif %}
TWIG,
        ]);

        $this->pushComponent($stack, 'Host', $escaper);
        $twig->render('Host/A.html.twig', $this->ctx($escaper, define: true));
        $twig->render('Host/B.html.twig', $this->ctx($escaper, define: true));

        $root = $twig->render('Host/B.html.twig', $this->ctx($escaper, call: true, slot: 'root'));
        $label = $twig->render('Host/B.html.twig', $this->ctx($escaper, call: true, slot: 'label'));

        self::assertSame('first-root', $root);
        self::assertSame('second-label', $label);
    }

    public function testViAttrsStaysNearestWins(): void
    {
        [$twig, $stack, $escaper] = $this->createStackTwig([
            'Navigation/Drawer.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_attrs(['title']) %}
{% endif %}
TWIG,
            'Drawer/Header.html.twig' => <<<'TWIG'
{% if define %}
{% do vi_define_attrs(['title']) %}
{% endif %}
{% if call %}{{ vi_attrs('title').all()|json_encode|raw }}{% endif %}
TWIG,
        ]);

        $this->pushComponent($stack, 'Navigation:Drawer', $escaper);
        $twig->render('Navigation/Drawer.html.twig', [
            'define' => true,
            'attributes' => new ComponentAttributes(['title:data-from' => 'parent'], $escaper),
        ]);

        $this->pushComponent($stack, 'Drawer:Header', $escaper);
        $twig->render('Drawer/Header.html.twig', [
            'define' => true,
            'attributes' => new ComponentAttributes(['title:data-from' => 'child'], $escaper),
        ]);

        $html = $twig->render('Drawer/Header.html.twig', [
            'call' => true,
            'attributes' => new ComponentAttributes([], $escaper),
        ]);

        self::assertSame('{"data-from":"child"}', $html);
    }

    /**
     * @param array<string, string> $templates
     *
     * @return array{0: Environment, 1: ComponentStack, 2: EscaperRuntime}
     */
    private function createStackTwig(array $templates): array
    {
        $stack = new ComponentStack();
        $twig = new Environment(new ArrayLoader($templates));
        $twig->addExtension(new ViUtilities($stack));

        return [$twig, $stack, $twig->getRuntime(EscaperRuntime::class)];
    }

    private function pushComponent(ComponentStack $stack, string $name, EscaperRuntime $escaper): void
    {
        $stack->push(new MountedComponent(
            $name,
            new \stdClass(),
            new ComponentAttributes([], $escaper),
        ));
    }

    /**
     * @return array<string, mixed>
     */
    private function ctx(EscaperRuntime $escaper, bool $define = false, bool $call = false, string $slot = 'title'): array
    {
        return [
            'define' => $define,
            'call' => $call,
            'slot' => $slot,
            'attributes' => new ComponentAttributes([], $escaper),
        ];
    }
}
