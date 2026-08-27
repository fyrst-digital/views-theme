<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Page\Footer;

use Fyrst\ViewsTheme\Resources\views\components\Page\Footer\Main;
use Fyrst\ViewsTheme\Service\FooterCmsUrlResolver;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Payment\PaymentMethodCollection;
use Shopware\Core\Checkout\Payment\PaymentMethodEntity;
use Shopware\Core\Checkout\Shipping\ShippingMethodCollection;
use Shopware\Core\Checkout\Shipping\ShippingMethodEntity;
use Shopware\Core\Content\Category\CategoryCollection;
use Shopware\Core\Content\Media\MediaEntity;
use Shopware\Core\Content\Seo\SeoUrlPlaceholderHandlerInterface;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Pagelet\Footer\FooterPagelet;
use Symfony\Component\HttpFoundation\RequestStack;

final class MainTest extends TestCase
{
    public function testNullFooterLeavesLogoListsEmpty(): void
    {
        $component = $this->createComponent();
        $component->postMount([]);

        self::assertSame([], $component->paymentLogos);
        self::assertSame([], $component->shippingLogos);
    }

    public function testEmptyCollectionsLeaveLogoListsEmpty(): void
    {
        $component = $this->createComponent();
        $component->footer = $this->footer();
        $component->postMount([]);

        self::assertSame([], $component->paymentLogos);
        self::assertSame([], $component->shippingLogos);
    }

    public function testSkipsMethodsWithoutMediaAndKeepsListsSeparate(): void
    {
        $payMedia = $this->media('pay-media');
        $shipMedia = $this->media('ship-media');

        $component = $this->createComponent();
        $component->footer = $this->footer(
            payments: [
                $this->payment('pay-skip', null, 'Skip pay'),
                $this->payment('pay-ok', $payMedia, 'Invoice'),
            ],
            shippings: [
                $this->shipping('ship-ok', $shipMedia, 'Standard'),
                $this->shipping('ship-skip', null, 'Skip ship'),
            ],
        );
        $component->postMount([]);

        self::assertCount(1, $component->paymentLogos);
        self::assertCount(1, $component->shippingLogos);
        self::assertSame($payMedia, $component->paymentLogos[0]['media']);
        self::assertSame($shipMedia, $component->shippingLogos[0]['media']);
        self::assertSame('Invoice', $component->paymentLogos[0]['alt']);
        self::assertSame('Invoice', $component->paymentLogos[0]['title']);
        self::assertSame('Standard', $component->shippingLogos[0]['alt']);
        self::assertSame('Standard', $component->shippingLogos[0]['title']);
    }

    public function testPrefersMediaAltAndTitleOverMethodName(): void
    {
        $payMedia = $this->media('pay-media', alt: 'Pay alt', title: 'Pay title');
        $shipMedia = $this->media('ship-media', alt: 'Ship alt', title: 'Ship title');

        $component = $this->createComponent();
        $component->footer = $this->footer(
            payments: [$this->payment('pay-ok', $payMedia, 'Invoice')],
            shippings: [$this->shipping('ship-ok', $shipMedia, 'Standard')],
        );
        $component->postMount([]);

        self::assertSame('Pay alt', $component->paymentLogos[0]['alt']);
        self::assertSame('Pay title', $component->paymentLogos[0]['title']);
        self::assertSame('Ship alt', $component->shippingLogos[0]['alt']);
        self::assertSame('Ship title', $component->shippingLogos[0]['title']);
    }

    public function testPaymentOnlyListWhenOnlyPaymentHasMedia(): void
    {
        $component = $this->createComponent();
        $component->footer = $this->footer(
            payments: [$this->payment('pay-ok', $this->media('pay-media'), 'Invoice')],
        );
        $component->postMount([]);

        self::assertCount(1, $component->paymentLogos);
        self::assertSame([], $component->shippingLogos);
    }

    public function testShippingOnlyListWhenOnlyShippingHasMedia(): void
    {
        $component = $this->createComponent();
        $component->footer = $this->footer(
            shippings: [$this->shipping('ship-ok', $this->media('ship-media'), 'Standard')],
        );
        $component->postMount([]);

        self::assertSame([], $component->paymentLogos);
        self::assertCount(1, $component->shippingLogos);
    }

    private function createComponent(): Main
    {
        $seo = $this->createStub(SeoUrlPlaceholderHandlerInterface::class);
        $seo->method('generate')->willReturn('#');

        $config = $this->createStub(SystemConfigService::class);
        $config->method('getString')->willReturn('');
        $config->method('getBool')->willReturn(false);

        $resolver = new FooterCmsUrlResolver(
            $seo,
            $config,
            new SalesChannelContextAccessor(new RequestStack()),
        );

        return new Main($resolver);
    }

    /**
     * @param list<PaymentMethodEntity> $payments
     * @param list<ShippingMethodEntity> $shippings
     */
    private function footer(array $payments = [], array $shippings = []): FooterPagelet
    {
        return new FooterPagelet(
            null,
            new CategoryCollection(),
            new PaymentMethodCollection($payments),
            new ShippingMethodCollection($shippings),
        );
    }

    private function payment(string $id, ?MediaEntity $media, string $name): PaymentMethodEntity
    {
        $method = new PaymentMethodEntity();
        $method->setId($id);
        $method->setTranslated(['name' => $name]);
        if ($media !== null) {
            $method->setMedia($media);
        }

        return $method;
    }

    private function shipping(string $id, ?MediaEntity $media, string $name): ShippingMethodEntity
    {
        $method = new ShippingMethodEntity();
        $method->setId($id);
        $method->setTranslated(['name' => $name]);
        if ($media !== null) {
            $method->setMedia($media);
        }

        return $method;
    }

    private function media(string $id, ?string $alt = null, ?string $title = null): MediaEntity
    {
        $media = new MediaEntity();
        $media->setId($id);
        $translated = [];
        if ($alt !== null) {
            $translated['alt'] = $alt;
        }
        if ($title !== null) {
            $translated['title'] = $title;
        }
        $media->setTranslated($translated);

        return $media;
    }
}
