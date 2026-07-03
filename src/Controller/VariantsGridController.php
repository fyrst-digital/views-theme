<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ThemeParametersResolver;
use Fyrst\ViewsTheme\Service\VariantsLoader;
use Fyrst\ViewsTheme\Struct\VariantsGridPagination;
use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\Error\Error;
use Shopware\Core\Checkout\Cart\LineItemFactoryRegistry;
use Shopware\Core\Checkout\Cart\SalesChannel\CartService;
use Shopware\Core\Framework\Routing\RoutingException;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class VariantsGridController extends StorefrontController
{
    private const CONFIG_ROWS_PER_PAGE = 'ViewsTheme.config.variantsGridRowsPerPage';
    private const PAGE_PARAMETER = 'variantsPage';
    private const DEFAULT_ROWS_TEMPLATE = '@Storefront/components/variants-grid/rows.html.twig';
    private const DEFAULT_PAGINATION_TEMPLATE = '@Storefront/components/variants-grid/pagination.html.twig';

    public function __construct(
        private readonly CartService $cartService,
        private readonly LineItemFactoryRegistry $lineItemFactoryRegistry,
        private readonly VariantsLoader $variantsLoader,
        private readonly SystemConfigService $systemConfig,
        private readonly Environment $twig,
        private readonly ThemeParametersResolver $themeParametersResolver,
    ) {}

    #[Route(path: '/checkout/variants-grid/add', name: 'frontend.checkout.variants-grid.add', defaults: ['XmlHttpRequest' => true], methods: ['POST'])]
    public function addVariants(Cart $cart, RequestDataBag $requestDataBag, Request $request, SalesChannelContext $context): Response
    {
        $lineItems = $requestDataBag->get('lineItems');
        if (!$lineItems instanceof RequestDataBag) {
            throw RoutingException::missingRequestParameter('lineItems');
        }

        $items = [];
        $count = 0;

        /** @var RequestDataBag $lineItemData */
        foreach ($lineItems as $lineItemData) {
            $data = $lineItemData->all();
            $quantity = isset($data['quantity']) ? (int) $data['quantity'] : 0;

            if ($quantity <= 0) {
                continue;
            }

            $item = $this->lineItemFactoryRegistry->create($this->getLineItemArray($data), $context);
            $count += $item->getQuantity();
            $items[] = $item;
        }

        if ($items === []) {
            $this->addFlash(self::DANGER, $this->trans('variantsGrid.error.noSelection'));

            return $this->createActionResponse($request);
        }

        $cart = $this->cartService->add($cart, $items, $context);

        if (!$this->traceErrors($cart)) {
            $this->addFlash(self::SUCCESS, $this->trans('checkout.addToCartSuccess', ['%count%' => $count]));
        }

        return $this->createActionResponse($request);
    }

    #[Route(path: '/checkout/variants-grid/load', name: 'frontend.checkout.variants-grid.load', defaults: ['XmlHttpRequest' => true], methods: ['GET'])]
    public function loadPage(Request $request, SalesChannelContext $context): JsonResponse
    {
        $parentId = (string) $request->query->get('parentId');
        $page = $request->query->getInt(self::PAGE_PARAMETER, 1);

        if ($parentId === '') {
            throw RoutingException::missingRequestParameter('parentId');
        }

        $limit = (int) $this->systemConfig->get(
            self::CONFIG_ROWS_PER_PAGE,
            $context->getSalesChannelId(),
        );

        if ($limit < 1) {
            $limit = 10;
        }

        $total = $this->variantsLoader->countVariantsByParentId($parentId, $context);

        if ($total === 0) {
            return new JsonResponse(['rows' => '', 'pagination' => '']);
        }

        $totalPages = (int) ceil($total / $limit);

        if ($page > $totalPages) {
            $page = $totalPages;
        }

        if ($page < 1) {
            $page = 1;
        }

        $offset = ($page - 1) * $limit;
        $pagedVariants = $this->variantsLoader->loadVariantsPageByParentId($parentId, $offset, $limit, $context);
        $groups = $this->variantsLoader->extractConfiguratorGroups($pagedVariants);

        $rowsTemplate = $this->resolveTemplate(
            $request->query->get('rowsTemplate'),
            self::DEFAULT_ROWS_TEMPLATE,
        );
        $paginationTemplate = $this->resolveTemplate(
            $request->query->get('paginationTemplate'),
            self::DEFAULT_PAGINATION_TEMPLATE,
        );

        $themeParameters = $this->themeParametersResolver->resolve($request, $context);

        $rowsHtml = $this->renderView($rowsTemplate, [
            'variants' => $pagedVariants,
            'groups' => $groups,
            'themeParameters' => $themeParameters ?? [],
        ]);

        $paginationHtml = $this->renderView($paginationTemplate, [
            'pagination' => new VariantsGridPagination($page, $limit, $total),
            'pageParameter' => self::PAGE_PARAMETER,
            'themeParameters' => $themeParameters ?? [],
        ]);

        return new JsonResponse([
            'rows' => $rowsHtml,
            'pagination' => $paginationHtml,
        ]);
    }

    /**
     * @param array<string|int, mixed> $data
     *
     * @return array<string|int, mixed>
     */
    private function getLineItemArray(array $data): array
    {
        if (isset($data['quantity'])) {
            $data['quantity'] = (int) $data['quantity'];
        }

        if (isset($data['stackable'])) {
            $data['stackable'] = (bool) $data['stackable'];
        }

        if (isset($data['removable'])) {
            $data['removable'] = (bool) $data['removable'];
        }

        if (isset($data['priceDefinition']['quantity'])) {
            $data['priceDefinition']['quantity'] = (int) $data['priceDefinition']['quantity'];
        }

        if (isset($data['priceDefinition']['isCalculated'])) {
            $data['priceDefinition']['isCalculated'] = (int) $data['priceDefinition']['isCalculated'];
        }

        return $data;
    }

    private function traceErrors(Cart $cart): bool
    {
        if ($cart->getErrors()->count() <= 0) {
            return false;
        }

        $this->addCartErrors($cart, fn(Error $error) => $error->isPersistent());

        return true;
    }

    private function resolveTemplate(mixed $template, string $default): string
    {
        if (!is_string($template) || $template === '') {
            return $default;
        }

        if (!preg_match('/^@[A-Za-z0-9_]+\/[A-Za-z0-9_\-\/\.]+\.html\.twig$/', $template)) {
            return $default;
        }

        if (str_contains($template, '..')) {
            return $default;
        }

        if (!$this->twig->getLoader()->exists($template)) {
            return $default;
        }

        return $template;
    }
}
