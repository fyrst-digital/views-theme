<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Cms;

use Fyrst\ViewsTheme\Resources\views\components\Cms\DescriptionReviews;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class DescriptionReviewsTest extends TestCase
{
    #[DataProvider('appearanceProvider')]
    public function testAppearanceNormalizesAndResolvesTemplate(
        string $appearance,
        string $expectedAppearance,
        string $expectedTemplate,
    ): void {
        $component = $this->createComponent();
        $component->appearance = $appearance;
        $component->showReview = false;
        $component->postMount([]);

        self::assertSame($expectedAppearance, $component->appearance);
        self::assertSame($expectedTemplate, $component->resolveTemplate());
    }

    /**
     * @return iterable<string, array{0: string, 1: string, 2: string}>
     */
    public static function appearanceProvider(): iterable
    {
        $tabs = '@ViewsTheme/components/Cms/DescriptionReviews.html.twig';
        $accordion = '@ViewsTheme/components/Cms/DescriptionReviews/Accordion.html.twig';

        yield 'default tabs' => [DescriptionReviews::APPEARANCE_TABS, 'tabs', $tabs];
        yield 'accordion' => ['accordion', 'accordion', $accordion];
        yield 'accordion case' => ['Accordion', 'accordion', $accordion];
        yield 'unknown' => ['carousel', 'tabs', $tabs];
        yield 'blank' => ['', 'tabs', $tabs];
    }

    private function createComponent(): DescriptionReviews
    {
        $config = $this->createStub(SystemConfigService::class);
        $context = new SalesChannelContextAccessor(new RequestStack());
        $urls = $this->createStub(UrlGeneratorInterface::class);

        return new DescriptionReviews($config, $context, $urls);
    }
}
