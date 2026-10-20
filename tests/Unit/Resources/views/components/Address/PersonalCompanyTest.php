<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Address;

use Fyrst\ViewsTheme\Resources\views\components\Address\PersonalCompany;
use Fyrst\ViewsTheme\Twig\ViUtilities;
use PHPUnit\Framework\TestCase;
use Symfony\UX\TwigComponent\ComponentAttributes;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;
use Twig\Runtime\EscaperRuntime;

final class PersonalCompanyTest extends TestCase
{
    public function testDefaultOrderAndSpans(): void
    {
        $component = new PersonalCompany();
        $component->postMount([]);

        self::assertSame(['company', 'department', 'vat'], $component->order);
        self::assertSame([
            'company' => 3,
            'department' => 3,
            'vat' => 3,
        ], $component->spans);
    }

    public function testOrderAndSpansFromCaller(): void
    {
        $component = new PersonalCompany();
        $component->order = ['vat', 'company', 'company', 'street'];
        $component->spans = ['company' => 6, 'vat' => '2', 'department' => 0];
        $component->postMount([]);

        self::assertSame(['vat', 'company'], $component->order);
        self::assertSame(6, $component->spans['company']);
        self::assertSame(2, $component->spans['vat']);
        self::assertSame(3, $component->spans['department']);
    }

    public function testSpanVariantUsesCallerValue(): void
    {
        $views = dirname(__DIR__, 6) . '/src/Resources/views';
        $loader = new FilesystemLoader([], $views);
        $loader->addPath($views, 'ViewsTheme');
        $twig = new Environment($loader);
        $twig->addExtension(new ViUtilities());

        $template = $twig->createTemplate(
            '{% do vi_define_cva(cva, "@ViewsTheme/components/Address/PersonalCompany.cva.twig") %}{{ vi_class("vat", { span: span }) }}',
        );

        $html = $template->render([
            'cva' => [],
            'span' => 6,
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);

        self::assertSame('vi-address-personal-company__vat g-col-6', $html);
    }
}
