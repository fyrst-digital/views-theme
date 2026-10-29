<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Checkout;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderAddress\OrderAddressEntity;
use Shopware\Core\System\Country\CountryEntity;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPage;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Checkout:Addresses — shipping and billing cards.
 * Template composes the section, title, columns, Address, and Address:Manager:Action.
 * `readOnly` (order recap): no context fallback, no shipping warning, no change action.
 */
#[AsTwigComponent]
class Addresses
{
    public mixed $page = null;

    public mixed $billingAddress = null;

    public mixed $shippingAddress = null;

    public ?bool $hideShippingAddress = null;

    public ?bool $addressesEqual = null;

    public bool $showShippingWarning = true;

    public bool $readOnly = false;

    public ?string $shippingTitle = null;

    public ?string $billingTitle = null;

    public ?string $equalTitle = null;

    public ?string $equalText = null;

    public ?string $changeLabel = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var list<array{
     *     nest: string,
     *     changeNest: string,
     *     title: string,
     *     tab: string,
     *     changeTitle: string,
     *     divided: bool,
     *     equal: bool,
     *     warn: bool,
     *     editHref: ?string,
     *     address: CustomerAddressEntity|OrderAddressEntity|null
     * }>
     */
    public array $cards = [];

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly TranslatorInterface $translator,
        private readonly UrlGeneratorInterface $urlGenerator,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->readOnly) {
            $customer = $this->salesChannelContextAccessor->get()?->getCustomer();
            $this->billingAddress ??= $customer?->getActiveBillingAddress();
            $this->shippingAddress ??= $customer?->getActiveShippingAddress();
        }

        $hideShipping = $this->hideShippingAddress ?? (
            $this->page instanceof CheckoutConfirmPage && $this->page->isHideShippingAddress()
        );
        $this->hideShippingAddress = $hideShipping;

        $equal = $this->addressesEqual ?? $this->sameAddress($this->billingAddress, $this->shippingAddress);
        $this->addressesEqual = $equal;

        $shippingTitle = $this->shippingTitle ?? $this->translator->trans('viewsTheme.checkout.confirmShippingTitle');
        $billingTitle = $this->billingTitle ?? $this->translator->trans('viewsTheme.checkout.confirmBillingTitle');
        $this->shippingTitle = $shippingTitle;
        $this->billingTitle = $billingTitle;
        $this->equalTitle ??= $this->translator->trans('viewsTheme.checkout.confirmAddressEqualTitle');
        $this->equalText ??= $this->translator->trans('viewsTheme.checkout.confirmAddressEqualText');
        $this->changeLabel ??= $this->translator->trans('viewsTheme.checkout.confirmAddressChange');

        $shippingChange = strip_tags($this->translator->trans('account.overviewChangeShipping'));
        $billingChange = strip_tags($this->translator->trans('account.overviewChangeBilling'));

        $cards = [];
        if (!$hideShipping) {
            $cards[] = $this->card(
                'shipping',
                'shippingChange',
                $shippingTitle,
                $this->shippingAddress,
                false,
                $this->showShippingWarning,
                'shipping',
                $shippingChange,
                false,
            );
        }

        $cards[] = $this->card(
            'billing',
            'billingChange',
            $billingTitle,
            $this->billingAddress,
            $equal && !$hideShipping,
            false,
            'billing',
            $billingChange,
            !$hideShipping,
        );

        $this->cards = $cards;
    }

    /**
     * @return array{
     *     nest: string,
     *     changeNest: string,
     *     title: string,
     *     tab: string,
     *     changeTitle: string,
     *     divided: bool,
     *     equal: bool,
     *     warn: bool,
     *     editHref: ?string,
     *     address: CustomerAddressEntity|OrderAddressEntity|null
     * }
     */
    private function card(
        string $nest,
        string $changeNest,
        string $title,
        mixed $address,
        bool $equal,
        bool $warn,
        string $tab,
        string $changeTitle,
        bool $divided,
    ): array {
        return [
            'nest' => $nest,
            'changeNest' => $changeNest,
            'title' => $title,
            'tab' => $tab,
            'changeTitle' => $changeTitle,
            'divided' => $divided,
            'equal' => $equal,
            'warn' => $warn && !$this->readOnly && $this->shippingUnavailable($address),
            'editHref' => $this->readOnly ? null : $this->editHref($address),
            'address' => $equal || !$this->isAddress($address) ? null : $address,
        ];
    }

    private function sameAddress(mixed $billing, mixed $shipping): bool
    {
        if (!$this->isAddress($billing) || !$this->isAddress($shipping)) {
            return false;
        }

        return $billing->getId() === $shipping->getId();
    }

    /**
     * @phpstan-assert-if-true CustomerAddressEntity|OrderAddressEntity $address
     */
    private function isAddress(mixed $address): bool
    {
        return $address instanceof CustomerAddressEntity || $address instanceof OrderAddressEntity;
    }

    private function shippingUnavailable(mixed $address): bool
    {
        if (!$this->isAddress($address)) {
            return false;
        }

        $country = $address->getCountry();

        return $country instanceof CountryEntity && !$country->getShippingAvailable();
    }

    private function editHref(mixed $address): ?string
    {
        if (!$address instanceof CustomerAddressEntity || $address->getId() === '') {
            return null;
        }

        return $this->urlGenerator->generate('frontend.account.address.edit.page', [
            'addressId' => $address->getId(),
        ]);
    }
}
