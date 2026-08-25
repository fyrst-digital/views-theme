<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Checkout\Success;

use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Checkout\Shipping\ShippingMethodEntity;
use Shopware\Core\Framework\Feature;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Checkout:Success:Shipping — selected order shipping method, 6.7 vs 6.8.
 */
#[AsTwigComponent]
class Shipping
{
    public mixed $page = null;

    public mixed $order = null;

    public mixed $method = null;

    public ?string $methodId = null;

    public mixed $media = null;

    public ?string $name = null;

    public ?string $description = null;

    public bool $visible = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $order = $this->order();
        if ($order === null) {
            return;
        }

        $delivery = Feature::isActive('v6.8.0.0')
            ? $order->getPrimaryOrderDelivery()
            : $order->getDeliveries()?->first();

        $method = $delivery?->getShippingMethod();
        if (!$method instanceof ShippingMethodEntity) {
            return;
        }

        $this->visible = true;
        $this->method = $method;
        $this->methodId = $method->getId();
        $this->media = $method->getMedia();
        $this->name = $this->translatedString($method, 'name');
        $this->description = $this->truncateDescription($method->getTranslation('description') ?? $method->getDescription());
    }

    private function order(): ?OrderEntity
    {
        if ($this->order instanceof OrderEntity) {
            return $this->order;
        }

        if (\is_object($this->page) && method_exists($this->page, 'getOrder')) {
            $resolved = $this->page->getOrder();

            return $resolved instanceof OrderEntity ? $resolved : null;
        }

        return null;
    }

    private function translatedString(ShippingMethodEntity $method, string $field): ?string
    {
        $translated = $method->getTranslation($field);
        if (is_string($translated) && $translated !== '') {
            return $translated;
        }

        if ($field === 'name') {
            $name = $method->getName();

            return is_string($name) && $name !== '' ? $name : null;
        }

        return null;
    }

    private function truncateDescription(mixed $description): ?string
    {
        if (!is_string($description) || $description === '') {
            return null;
        }

        if (mb_strlen($description) > 75) {
            return mb_substr($description, 0, 75) . ' ...';
        }

        return $description;
    }
}
