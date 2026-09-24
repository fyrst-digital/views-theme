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
