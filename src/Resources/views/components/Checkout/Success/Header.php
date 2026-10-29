<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Checkout\Success;

use Fyrst\ViewsTheme\Struct\PageTitleMeta;
use Shopware\Core\Checkout\Customer\Service\EmailIdnConverter;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Framework\Feature;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Page\Checkout\Finish\CheckoutFinishPage;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Checkout:Success:Header — heading, intro copy and keyed meta for Page:Title.
 * Template fills the description block and passes the grid class through.
 */
#[AsTwigComponent]
class Header
{
    public mixed $page = null;

    public string $heading = '';

    public string $description = '';

    public string $orderNumber = '';

    /**
     * @var array<string, PageTitleMeta>
     */
    public array $meta = [];

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->page instanceof CheckoutFinishPage) {
            return;
        }

        $order = $this->page->getOrder();
        $this->orderNumber = (string) $order->getOrderNumber();

        if ($this->page->isChangedPayment()) {
            $this->heading = $this->translator->trans('checkout.finishUpdateHeader');
            $this->description = $this->translator->trans('checkout.finishPaymentHeader', [
                '%paymentName%' => $this->paymentName($order),
            ]);
        } else {
            $this->heading = $this->translator->trans('checkout.finishHeader', [
                '%shop%' => $this->systemConfigService->get('core.basicInformation.shopName', $order->getSalesChannelId()),
            ]);
            $this->description = $this->translator->trans('checkout.finishInfoConfirmationMail');
        }

        $meta = [];

        if ($this->orderNumber !== '') {
            $meta['orderNumber'] = new PageTitleMeta(
                $this->translator->trans('checkout.finishInfoOrdernumber') . $this->orderNumber,
            );
        }

        $email = $order->getOrderCustomer()?->getEmail();
        if (\is_string($email) && $email !== '') {
            $meta['email'] = new PageTitleMeta(EmailIdnConverter::decode($email));
        }

        $this->meta = $meta;
    }

    private function paymentName(OrderEntity $order): string
    {
        $transaction = Feature::isActive('v6.8.0.0')
            ? $order->getPrimaryOrderTransaction()
            : $order->getTransactions()?->last();

        $name = $transaction?->getPaymentMethod()?->getTranslation('name');

        return \is_string($name) ? $name : '';
    }
}
