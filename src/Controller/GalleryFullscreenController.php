<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Shopware\Core\Content\Media\MediaCollection;
use Shopware\Core\Content\Media\SalesChannel\AbstractMediaRoute;
use Shopware\Core\Framework\Uuid\Uuid;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class GalleryFullscreenController extends AbstractComponentController
{
    private const MAX_IDS = 50;

    public function __construct(
        ComponentRendererInterface $components,
        ComponentHtmlRenderer $htmlRenderer,
        private readonly AbstractMediaRoute $mediaRoute,
    ) {
        parent::__construct($components, $htmlRenderer);
    }

    #[Route(
        path: '/vi/gallery/fullscreen',
        name: 'frontend.views-theme.gallery.fullscreen',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function fullscreen(Request $request, SalesChannelContext $context): Response
    {
        $ids = $this->normalizeIds($request->query->all('ids'));
        $active = max(0, $request->query->getInt('active', 0));

        $medias = [];
        if ($ids !== []) {
            $loadRequest = new Request();
            $loadRequest->query->set('ids', $ids);

            $collection = $this->mediaRoute->load($loadRequest, $context)->getMediaCollection();
            $medias = $this->orderByIds($collection, $ids);
        }

        if ($medias !== [] && $active >= \count($medias)) {
            $active = \count($medias) - 1;
        }

        return $this->renderComponent('ViewsTheme:Gallery:Fullscreen', [
            'medias' => $medias,
            'active' => $active,
        ]);
    }

    /**
     * @param mixed $raw
     *
     * @return list<string>
     */
    private function normalizeIds(mixed $raw): array
    {
        if (!\is_array($raw)) {
            if (\is_string($raw) && $raw !== '') {
                $raw = [$raw];
            } else {
                return [];
            }
        }

        $ids = [];
        foreach ($raw as $id) {
            if (!\is_string($id) && !\is_numeric($id)) {
                continue;
            }

            $value = trim((string) $id);
            if ($value === '' || !Uuid::isValid($value) || \in_array($value, $ids, true)) {
                continue;
            }

            $ids[] = $value;

            if (\count($ids) >= self::MAX_IDS) {
                break;
            }
        }

        return $ids;
    }

    /**
     * @param list<string> $ids
     *
     * @return list<\Shopware\Core\Content\Media\MediaEntity>
     */
    private function orderByIds(MediaCollection $collection, array $ids): array
    {
        $ordered = [];
        foreach ($ids as $id) {
            $media = $collection->get($id);
            if ($media !== null) {
                $ordered[] = $media;
            }
        }

        return $ordered;
    }
}
