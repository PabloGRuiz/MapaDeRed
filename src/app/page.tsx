'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/UI/Header';
import { Sidebar } from '@/components/UI/Sidebar';
import { NodeDetailModal } from '@/components/UI/NodeDetailModal';
import { CentralAuditDashboardModal } from '@/components/Audit/CentralAuditDashboardModal';
import { CreateSiteWizardModal } from '@/components/Wizard/CreateSiteWizardModal';
import { CreateLinkModal } from '@/components/Wizard/CreateLinkModal';
import { ARGENTINA_CENTER, ARGENTINA_DEFAULT_ZOOM } from '@/data/mockNodes';
import { NetworkNode, MapStyleMode, FilterState, NodeType } from '@/types/network';
import { NetworkCentralProvider, useNetworkCentral } from '@/context/NetworkCentralContext';

// Dynamically import Map component to ensure client-side only execution without SSR issues
const InteractiveMap = dynamic(
  () => import('@/components/Map/InteractiveMap').then(mod => mod.InteractiveMap),
  { ssr: false }
);

const ALL_TYPES: NodeType[] = [
  'submarine_cable',
  'datacenter',
  'core_backbone',
  '5g_tower',
  'energy_hub'
];

function HomeContent() {
  const { 
    nodes, 
    links,
    selectedNode, 
    setSelectedNode, 
    isDashboardOpen, 
    setIsDashboardOpen,
    isWizardOpen,
    setIsWizardOpen,
    isLinkModalOpen,
    setIsLinkModalOpen
  } = useNetworkCentral();

  const [currentStyle, setCurrentStyle] = useState<MapStyleMode>('dark');
  const [headerHeight, setHeaderHeight] = useState<number>(72);
  const [targetCoords, setTargetCoords] = useState<{
    coords: [number, number];
    zoom?: number;
    pitch?: number;
    timestamp: number;
  } | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    types: ALL_TYPES,
    status: 'all',
    auditStatus: 'all',
    maxLatency: 45
  });

  // Filter nodes based on user criteria (search, category, status, auditStatus, latency)
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = node.name.toLowerCase().includes(query);
        const matchesCity = node.city.toLowerCase().includes(query);
        const matchesProvince = node.province.toLowerCase().includes(query);
        const matchesObs = (node.observations || node.description || '').toLowerCase().includes(query);
        const matchesAsn = (node.asn || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesProvince && !matchesObs && !matchesAsn) {
          return false;
        }
      }

      // Type filter
      if (!filters.types.includes(node.type)) {
        return false;
      }

      // Operational Status filter
      if (filters.status !== 'all' && node.status !== filters.status) {
        return false;
      }

      // Audit Status filter
      if (filters.auditStatus !== 'all' && node.auditStatus !== filters.auditStatus) {
        return false;
      }

      // Max latency (si tiene latencia configurada)
      if (node.latency !== undefined && node.latency > filters.maxLatency) {
        return false;
      }

      return true;
    });
  }, [nodes, filters]);

  // Links connecting to visible nodes
  const activeLinks = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    return links.filter(
      link => visibleNodeIds.has(link.sourceId) && visibleNodeIds.has(link.targetId)
    );
  }, [filteredNodes, links]);

  const [urlTab, setUrlTab] = useState<'info' | 'visio' | 'excel' | 'improvements'>('info');

  const handleFlyTo = (coords: [number, number], zoom = 7.5, pitch = 45) => {
    setTargetCoords({
      coords,
      zoom,
      pitch,
      timestamp: Date.now()
    });
  };

  const handleResetToArgentina = () => {
    setSelectedNode(null);
    handleFlyTo(ARGENTINA_CENTER, ARGENTINA_DEFAULT_ZOOM, 25);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('node');
      url.searchParams.delete('tab');
      window.history.replaceState({}, '', url.pathname);
    }
  };

  const handleSelectNode = (node: NetworkNode | null) => {
    setSelectedNode(node);
    if (node) {
      handleFlyTo(node.coordinates, 8, 48);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('node', node.id);
        window.history.replaceState({}, '', url.toString());
      }
    } else {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('node');
        url.searchParams.delete('tab');
        window.history.replaceState({}, '', url.pathname);
      }
    }
  };

  // Deep Linking: Leer parámetros de URL al montar la página (ej: ?node=cordoba&tab=visio)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const nodeParam = params.get('node');
    const tabParam = params.get('tab');

    if (tabParam === 'visio' || tabParam === 'excel' || tabParam === 'inventory' || tabParam === 'improvements' || tabParam === 'info') {
      setUrlTab(tabParam === 'inventory' ? 'excel' : (tabParam as 'info' | 'visio' | 'excel' | 'improvements'));
    }

    if (nodeParam && nodes.length > 0) {
      const cleanParam = nodeParam.toLowerCase().trim();
      const match = nodes.find(n => 
        n.id.toLowerCase() === cleanParam ||
        n.city.toLowerCase() === cleanParam ||
        n.name.toLowerCase() === cleanParam
      );

      if (match) {
        setSelectedNode(match);
        handleFlyTo(match.coordinates, 8, 48);
      }
    }
  }, [nodes]);

  const handleDashboardInspect = (node: NetworkNode) => {
    setIsDashboardOpen(false);
    handleSelectNode(node);
  };

  return (
    <main style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#060911'
    }}>
      {/* Top Header */}
      <Header
        currentStyle={currentStyle}
        onStyleChange={setCurrentStyle}
        totalNodes={filteredNodes.length}
        activeLinksCount={activeLinks.length}
        onResetView={handleResetToArgentina}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onHeightChange={setHeaderHeight}
      />

      {/* Main Interactive Map */}
      <InteractiveMap
        nodes={filteredNodes}
        links={activeLinks}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
        currentStyle={currentStyle}
        targetCoords={targetCoords}
      />

      {/* Left Collapsible Glassmorphic Sidebar with Audit Filters */}
      <Sidebar
        nodes={filteredNodes}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
        filters={filters}
        onFilterChange={setFilters}
        topOffset={headerHeight + 20}
      />

      {/* Node Detail Floating Card with Visio / Excel / Telemetry / Improvements Tabs */}
      {selectedNode && (
        <NodeDetailModal
          node={selectedNode}
          allNodes={nodes}
          links={links}
          initialTab={urlTab}
          onClose={() => handleSelectNode(null)}
          onFlyTo={(coords, zoom) => handleFlyTo(coords, zoom ?? 8, 50)}
          onSelectNode={handleSelectNode}
        />
      )}

      {/* Central NOC National Audit Dashboard Modal */}
      {isDashboardOpen && (
        <CentralAuditDashboardModal
          onClose={() => setIsDashboardOpen(false)}
          onFlyToNode={handleDashboardInspect}
        />
      )}

      {/* Guided Wizard to Add New Network Site Step-by-Step */}
      {isWizardOpen && (
        <CreateSiteWizardModal
          onClose={() => setIsWizardOpen(false)}
          onSuccess={(newNode) => {
            setIsWizardOpen(false);
            handleSelectNode(newNode);
          }}
        />
      )}

      {/* Modal to Configure and Connect Links Between Sites */}
      {isLinkModalOpen && (
        <CreateLinkModal
          onClose={() => setIsLinkModalOpen(false)}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <NetworkCentralProvider>
      <HomeContent />
    </NetworkCentralProvider>
  );
}
