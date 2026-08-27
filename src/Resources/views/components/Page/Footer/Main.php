<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Page\Footer;

use Fyrst\ViewsTheme\Service\FooterCmsUrlResolver;
use Shopware\Core\Checkout\Payment\PaymentMethodCollection;
use Shopware\Core\Checkout\Payment\PaymentMethodEntity;
use Shopware\Core\Checkout\Shipping\ShippingMethodCollection;
use Shopware\Core\Checkout\Shipping\ShippingMethodEntity;
use Shopware\Core\Content\Media\MediaEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Storefront\Pagelet\Footer\FooterPagelet;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Page:Footer:Main — CMS URLs + payment/shipping logos; Twig only composes.
 */
#[AsTwigComponent]
class Main
{
    public mixed $footer = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public string $contactUrl = '#';

    public string $revocationUrl = '#';

    public string $shippingUrl = '#';

    public bool $showRevocation = false;

    /**
     * @var list<array{media: MediaEntity, alt: string, title: string}>
     */
    public array $paymentLogos = [];

    /**
     * @var list<array{media: MediaEntity, alt: string, title: string}>
     */
    public array $shippingLogos = [];

    public function __construct(
        private readonly FooterCmsUrlResolver $footerCmsUrlResolver,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->footer instanceof FooterPagelet) {
            return;
        }

        $urls = $this->footerCmsUrlResolver->urls($this->footer);
        $this->contactUrl = $urls['contactUrl'];
        $this->revocationUrl = $urls['revocationUrl'];
        $this->shippingUrl = $urls['shippingUrl'];
        $this->showRevocation = $urls['showRevocation'];

        $this->paymentLogos = $this->logosFrom($this->footer->getPaymentMethods());
        $this->shippingLogos = $this->logosFrom($this->footer->getShippingMethods());
    }

    /**
     * @return list<array{media: MediaEntity, alt: string, title: string}>
     */
    private function logosFrom(PaymentMethodCollection|ShippingMethodCollection $methods): array
    {
        $items = [];

        foreach ($methods as $method) {
            if (!$method instanceof PaymentMethodEntity && !$method instanceof ShippingMethodEntity) {
                continue;
            }

            $media = $method->getMedia();
            if (!$media instanceof MediaEntity) {
                continue;
            }

            $label = $this->translatedString($method, 'name');
            $alt = $this->translatedString($media, 'alt');
            $title = $this->translatedString($media, 'title');

            $items[] = [
                'media' => $media,
                'alt' => $alt !== '' ? $alt : $label,
                'title' => $title !== '' ? $title : $label,
            ];
        }

        return $items;
    }

    private function translatedString(Entity $entity, string $field): string
    {
        $translated = $entity->getTranslation($field);

        return \is_string($translated) && $translated !== '' ? $translated : '';
    }
}
