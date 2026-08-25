<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\Checkout\Customer\CustomerException;
use Shopware\Core\Checkout\Customer\SalesChannel\AbstractListAddressRoute;
use Shopware\Core\Checkout\Customer\SalesChannel\AbstractUpsertAddressRoute;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Routing\RoutingException;
use Shopware\Core\Framework\Uuid\Uuid;
use Shopware\Core\Framework\Validation\DataBag\DataBag;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\Framework\Validation\Exception\ConstraintViolationException;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\Context\SalesChannelContextService;
use Shopware\Core\System\SalesChannel\SalesChannel\AbstractContextSwitchRoute;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Shopware\Storefront\Page\Address\Listing\AddressBookWidgetLoadedHook;
use Shopware\Storefront\Page\Address\Listing\AddressListingPage;
use Shopware\Storefront\Page\Address\Listing\AddressListingPageLoader;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class AddressManagerController extends AbstractComponentController
{
    private const TYPE_SHIPPING = 'shipping';

    private const TYPE_BILLING = 'billing';

    public function __construct(
        ComponentRendererInterface $components,
        ComponentHtmlRenderer $htmlRenderer,
        private readonly AddressListingPageLoader $addressListingPageLoader,
        private readonly AbstractListAddressRoute $listAddressRoute,
        private readonly AbstractUpsertAddressRoute $updateAddressRoute,
        private readonly AbstractContextSwitchRoute $contextSwitchRoute,
    ) {
        parent::__construct($components, $htmlRenderer);
    }

    #[Route(
        path: '/vi/address/manager',
        name: 'frontend.views-theme.address.manager',
        defaults: [
            'XmlHttpRequest' => true,
            PlatformRequest::ATTRIBUTE_LOGIN_REQUIRED => true,
            PlatformRequest::ATTRIBUTE_LOGIN_REQUIRED_ALLOW_GUEST => true,
        ],
        methods: ['GET'],
    )]
    public function manager(Request $request, SalesChannelContext $context, CustomerEntity $customer): Response
    {
        $page = $this->loadPage($request, $context, $customer);

        return $this->renderComponent('ViewsTheme:Address:Manager', $this->managerProps($request, $page));
    }

    #[Route(
        path: '/vi/address/editor',
        name: 'frontend.views-theme.address.editor',
        defaults: [
            'XmlHttpRequest' => true,
            PlatformRequest::ATTRIBUTE_LOGIN_REQUIRED => true,
            PlatformRequest::ATTRIBUTE_LOGIN_REQUIRED_ALLOW_GUEST => true,
        ],
        methods: ['GET'],
    )]
    public function editorForm(Request $request, SalesChannelContext $context, CustomerEntity $customer): Response
    {
        $type = $this->requireType($request);
        $addressId = $this->addressId($request);
        $page = $this->loadPage($request, $context, $customer);
        $address = $addressId !== null ? $this->getById($addressId, $context, $customer) : null;

        return $this->renderEditorView($page, $context, $type, $addressId, $address, null);
    }

    #[Route(
        path: '/vi/address/editor',
        name: 'frontend.views-theme.address.editor.save',
        defaults: [
            'XmlHttpRequest' => true,
            PlatformRequest::ATTRIBUTE_LOGIN_REQUIRED => true,
            PlatformRequest::ATTRIBUTE_LOGIN_REQUIRED_ALLOW_GUEST => true,
        ],
        methods: ['POST'],
    )]
    public function editorSave(
        Request $request,
        RequestDataBag $dataBag,
        SalesChannelContext $context,
        CustomerEntity $customer,
    ): Response {
        $type = $this->requireType($request);
        $addressId = $this->addressId($request);
        $addressData = $dataBag->get('address');

        if (!$addressData instanceof RequestDataBag) {
            $page = $this->loadPage($request, $context, $customer);

            return $this->renderEditorView(
                $page,
                $context,
                $type,
                $addressId,
                null,
                null,
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        if ($addressId !== null) {
            $addressData->set('id', $addressId);
        }

        try {
            $response = $this->updateAddressRoute->upsert(
                $addressId,
                $addressData->toRequestDataBag(),
                $context,
                $customer,
            );
            $savedId = $response->getAddress()->getId();
            $this->switchContextAddress($savedId, $type, $context);
            $this->addFlash(self::SUCCESS, $this->trans('account.addressSaved'));

            return new Response('', Response::HTTP_NO_CONTENT);
        } catch (ConstraintViolationException $violations) {
            $page = $this->loadPage($request, $context, $customer);

            return $this->renderEditorView(
                $page,
                $context,
                $type,
                $addressId,
                $this->bagToArray($addressData),
                $violations,
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }
    }

    #[Route(
        path: '/vi/address/switch',
        name: 'frontend.views-theme.address.switch',
        defaults: [
            'XmlHttpRequest' => true,
            PlatformRequest::ATTRIBUTE_LOGIN_REQUIRED => true,
            PlatformRequest::ATTRIBUTE_LOGIN_REQUIRED_ALLOW_GUEST => true,
        ],
        methods: ['POST'],
    )]
    public function switchAddress(Request $request, SalesChannelContext $context): Response
    {
        if (!$request->request->get(SalesChannelContextService::SHIPPING_ADDRESS_ID)) {
            $request->request->remove(SalesChannelContextService::SHIPPING_ADDRESS_ID);
        }

        if (!$request->request->get(SalesChannelContextService::BILLING_ADDRESS_ID)) {
            $request->request->remove(SalesChannelContextService::BILLING_ADDRESS_ID);
        }

        $this->contextSwitchRoute->switchContext(new RequestDataBag($request->request->all()), $context);
        $this->addFlash(self::SUCCESS, $this->trans('account.addressSuccessfulChange'));

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    private function loadPage(Request $request, SalesChannelContext $context, CustomerEntity $customer): AddressListingPage
    {
        $page = $this->addressListingPageLoader->load($request, $context, $customer);
        $this->hook(new AddressBookWidgetLoadedHook($page, $context));

        return $page;
    }

    /**
     * @return array<string, mixed>
     */
    private function managerProps(Request $request, AddressListingPage $page): array
    {
        $tab = $request->query->getString('tab', self::TYPE_SHIPPING);
        $tab = $tab === self::TYPE_BILLING ? self::TYPE_BILLING : self::TYPE_SHIPPING;

        return [
            'page' => $page,
            'tab' => $tab,
            'hideShipping' => $request->query->getBoolean('hideShipping'),
            'redirectTo' => $request->query->getString('redirectTo', 'frontend.checkout.confirm.page'),
            'managerUrl' => $this->generateUrl('frontend.views-theme.address.manager'),
            'editorUrl' => $this->generateUrl('frontend.views-theme.address.editor'),
            'switchUrl' => $this->generateUrl('frontend.views-theme.address.switch'),
            'defaultUrl' => $this->generateUrl('frontend.account.address.switch-default'),
        ];
    }

    /**
     * @param CustomerAddressEntity|array<string, mixed>|null $editorData
     */
    private function renderEditorView(
        AddressListingPage $page,
        SalesChannelContext $context,
        string $type,
        ?string $addressId,
        mixed $editorData,
        mixed $formViolations,
        int $status = Response::HTTP_OK,
    ): Response {
        $params = array_filter([
            'type' => $type,
            'addressId' => $addressId,
        ]);

        $response = $this->renderComponent('ViewsTheme:Address:Manager:View', [
            'mode' => 'editor',
            'title' => $this->editorTitle($type, $addressId),
            'page' => $page,
            'type' => $type,
            'editorAction' => $this->generateUrl('frontend.views-theme.address.editor.save', $params),
            'editorData' => $editorData,
            'formViolations' => $formViolations,
            'submitLabel' => $this->editorSubmitLabel($context, $type, $addressId),
            'formId' => 'vi-address-editor',
        ]);
        $response->setStatusCode($status);

        return $response;
    }

    private function editorTitle(string $type, ?string $addressId): string
    {
        if ($addressId !== null) {
            return $this->trans('account.addressEditWelcome');
        }

        return $type === self::TYPE_SHIPPING
            ? $this->trans('account.addressNewShipping')
            : $this->trans('account.addressNewBilling');
    }

    private function editorSubmitLabel(SalesChannelContext $context, string $type, ?string $addressId): string
    {
        $entity = $context->getCustomer();
        $activeId = $type === self::TYPE_SHIPPING
            ? $entity?->getActiveShippingAddress()?->getId()
            : $entity?->getActiveBillingAddress()?->getId();

        if ($addressId !== null && $addressId === $activeId) {
            return $this->trans('account.addressSaveChange');
        }

        return $this->trans('account.addressSaveAndUse');
    }

    private function switchContextAddress(string $addressId, string $type, SalesChannelContext $context): void
    {
        $bag = new RequestDataBag();
        $bag->set(
            $type === self::TYPE_SHIPPING
                ? SalesChannelContextService::SHIPPING_ADDRESS_ID
                : SalesChannelContextService::BILLING_ADDRESS_ID,
            $addressId,
        );

        $this->contextSwitchRoute->switchContext($bag, $context);
    }

    private function requireType(Request $request): string
    {
        $type = $request->query->getString('type', $request->request->getString('type'));
        if (!\in_array($type, [self::TYPE_SHIPPING, self::TYPE_BILLING], true)) {
            throw RoutingException::invalidRequestParameter('type');
        }

        return $type;
    }

    private function addressId(Request $request): ?string
    {
        $addressId = $request->query->get('addressId', $request->request->get('addressId'));
        if (!\is_string($addressId) || $addressId === '') {
            return null;
        }

        return $addressId;
    }

    private function getById(
        string $addressId,
        SalesChannelContext $context,
        CustomerEntity $customer,
    ): CustomerAddressEntity {
        if (!Uuid::isValid($addressId)) {
            throw CustomerException::addressNotFound($addressId);
        }

        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('id', $addressId));
        $criteria->addFilter(new EqualsFilter('customerId', $customer->getId()));

        $address = $this->listAddressRoute->load($criteria, $context, $customer)->getAddressCollection()->get($addressId);
        if (!$address instanceof CustomerAddressEntity) {
            throw CustomerException::addressNotFound($addressId);
        }

        return $address;
    }

    /**
     * @return array<string, mixed>
     */
    private function bagToArray(DataBag $bag): array
    {
        $out = [];
        foreach ($bag->all() as $key => $value) {
            $out[(string) $key] = $value instanceof DataBag ? $this->bagToArray($value) : $value;
        }

        return $out;
    }
}
