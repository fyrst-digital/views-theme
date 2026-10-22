<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Checkout\Confirm;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Fyrst\ViewsTheme\Struct\CheckoutTitleMeta;
use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\Delivery\Struct\Delivery;
use Shopware\Core\Checkout\Customer\Service\EmailIdnConverter;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPage;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Checkout:Confirm:Title — heading and keyed meta for Checkout:Title.
 * Template fills the description block and passes the grid class through.
 */
#[AsTwigComponent]
class Title
{
    public mixed $page = null;

    public string $heading = '';

    /**
     * @var array<string, CheckoutTitleMeta>
     */
    public array $meta = [];

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly TranslatorInterface $translator,
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->heading = $this->translator->trans('checkout.confirmHeader');

        if (!$this->page instanceof CheckoutConfirmPage) {
            return;
        }

        $meta = [];

        $email = $this->customerEmail();
        if ($email !== '') {
            $meta['email'] = new CheckoutTitleMeta($email);
        }

        $meta['items'] = new CheckoutTitleMeta($this->translator->trans('checkout.itemCounter', [
            '%count%' => $this->page->getCart()->getLineItems()->count(),
        ]));

        $arrival = $this->arrivalLabel($this->page->getCart());
        if ($arrival !== null) {
            $meta['arrival'] = new CheckoutTitleMeta($arrival);
        }

        $this->meta = $meta;
    }

    private function customerEmail(): string
    {
        $email = $this->salesChannelContextAccessor->get()?->getCustomer()?->getEmail();
        if (!\is_string($email) || $email === '') {
            return '';
        }

        return EmailIdnConverter::decode($email);
    }

    private function arrivalLabel(Cart $cart): ?string
    {
        $delivery = $cart->getDeliveries()->first();
        if (!$delivery instanceof Delivery) {
            return null;
        }

        $earliest = $delivery->getDeliveryDate()->getEarliest();
        $latest = $delivery->getDeliveryDate()->getLatest();
        $locale = $this->requestStack->getCurrentRequest()?->getLocale() ?? 'en-GB';
        $sameMonth = $earliest->format('Y-m') === $latest->format('Y-m');

        $earliestLabel = $this->formatDate($earliest, $locale, $sameMonth ? 'd' : 'd MMMM');
        $latestLabel = $this->formatDate($latest, $locale, 'd MMMM');
        if ($earliestLabel === '' || $latestLabel === '') {
            return null;
        }

        return $this->translator->trans('checkout.confirmArrival', [
            '%earliest%' => $earliestLabel,
            '%latest%' => $latestLabel,
        ]);
    }

    private function formatDate(\DateTimeInterface $date, string $locale, string $pattern): string
    {
        $formatter = new \IntlDateFormatter(
            $locale,
            \IntlDateFormatter::NONE,
            \IntlDateFormatter::NONE,
            $date->getTimezone(),
            \IntlDateFormatter::GREGORIAN,
            $pattern,
        );

        $formatted = $formatter->format($date);

        return \is_string($formatted) ? $formatted : '';
    }
}
