<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Shipping;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\Delivery\Struct\Delivery;
use Shopware\Core\Checkout\Shipping\ShippingMethodEntity;
use Shopware\Core\Content\Product\State;
use Shopware\Core\Framework\Struct\ArrayStruct;
use Shopware\Core\System\Currency\CurrencyFormatter;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPage;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Shipping:Selection — method rows, descriptions, and quoted totals.
 */
#[AsTwigComponent]
class Selection
{
    public mixed $page = null;

    public ?string $selectedId = null;

    public string $redirectTo = 'frontend.checkout.confirm.page';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public string $titleId = '';

    /**
     * @var list<array{id: string, name: ?string, description: ?string, trailing: ?string, checked: bool}>
     */
    public array $rows = [];

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly CurrencyFormatter $currencyFormatter,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->selectedId ??= $this->salesChannelContextAccessor->get()?->getShippingMethod()->getId();
        $this->titleId = 'vi-shipping-selection-' . bin2hex(random_bytes(4));

        if (!$this->page instanceof CheckoutConfirmPage) {
            return;
        }

        $cart = $this->page->getCart();
        if (!$cart->getLineItems()->hasLineItemWithState(State::IS_PHYSICAL)) {
            return;
        }

        $this->visible = true;
        $this->rows = $this->rows($this->page, $cart);
    }

    /**
     * @return list<array{id: string, name: ?string, description: ?string, trailing: ?string, checked: bool}>
     */
    private function rows(CheckoutConfirmPage $page, Cart $cart): array
    {
        $quotes = $this->quotes($page);
        $rows = [];

        foreach ($page->getShippingMethods() as $method) {
            if (!$method instanceof ShippingMethodEntity) {
                continue;
            }

            $id = $method->getId();
            $checked = $this->selectedId !== null && $id === $this->selectedId;

            $rows[] = [
                'id' => $id,
                'name' => $this->name($method),
                'description' => $this->truncateDescription($method->getTranslation('description')),
                'trailing' => $this->trailing($this->amount($quotes, $method, $cart, $checked)),
                'checked' => $checked,
            ];
        }

        return $rows;
    }

    private function trailing(?float $amount): ?string
    {
        if ($amount === null) {
            return null;
        }

        if ($amount == 0.0) {
            return $this->translator->trans('viewsTheme.checkout.shippingFree');
        }

        $context = $this->salesChannelContextAccessor->get();
        if ($context === null) {
            return null;
        }

        return $this->currencyFormatter->formatCurrencyByLanguage(
            $amount,
            $context->getCurrency()->getIsoCode(),
            $context->getLanguageId(),
            $context->getContext(),
        );
    }

    private function quotes(CheckoutConfirmPage $page): ?ArrayStruct
    {
        $viewsTheme = $page->getExtension('viewsTheme');
        if (!$viewsTheme instanceof ArrayStruct) {
            return null;
        }

        $prices = $viewsTheme->get('shippingPrices');

        return $prices instanceof ArrayStruct ? $prices : null;
    }

    private function amount(?ArrayStruct $quotes, ShippingMethodEntity $method, Cart $cart, bool $selected): ?float
    {
        $quoted = $this->quotedAmount($quotes, $method->getId());
        if ($quoted !== null) {
            return $quoted;
        }

        if (!$selected) {
            return null;
        }

        foreach ($cart->getDeliveries() as $delivery) {
            if (!$delivery instanceof Delivery) {
                continue;
            }

            if ($delivery->getShippingMethod()->getId() !== $method->getId()) {
                continue;
            }

            return $delivery->getShippingCosts()->getTotalPrice();
        }

        return null;
    }

    private function quotedAmount(?ArrayStruct $quotes, string $methodId): ?float
    {
        if (!$quotes instanceof ArrayStruct) {
            return null;
        }

        $amount = $quotes->get($methodId);
        if (\is_int($amount) || \is_float($amount)) {
            return (float) $amount;
        }

        return null;
    }

    private function name(ShippingMethodEntity $method): ?string
    {
        $translated = $method->getTranslation('name');
        if (\is_string($translated) && $translated !== '') {
            return $translated;
        }

        $name = $method->getName();

        return \is_string($name) && $name !== '' ? $name : null;
    }

    private function truncateDescription(mixed $description): ?string
    {
        if (!\is_string($description) || $description === '') {
            return null;
        }

        $description = trim(strip_tags($description));
        if ($description === '') {
            return null;
        }

        if (mb_strlen($description) > 75) {
            return mb_substr($description, 0, 75) . ' ...';
        }

        return $description;
    }
}
