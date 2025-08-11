# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Custom research tools for PubMed, Perplexity Sonar, and Brave Search integration."""

import os
import json
import logging
import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import aiohttp
import asyncio
import xml.etree.ElementTree as ET

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class PubMedArticle:
    """Represents a PubMed article with key metadata."""
    pmid: str
    title: str
    abstract: str
    authors: List[str]
    journal: str
    pub_date: str
    keywords: List[str]
    doi: Optional[str] = None


async def _search_pubmed(query: str, max_results: int = 10, sort: str = "relevance") -> List[str]:
    """Search PubMed and return PMIDs."""
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    email = os.getenv("PUBMED_EMAIL", "research@example.com")
    api_key = os.getenv("PUBMED_API_KEY", "")
    
    search_url = f"{base_url}/esearch.fcgi"
    params = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "retmode": "json",
        "sort": sort,
        "email": email
    }
    
    if api_key:
        params["api_key"] = api_key
    
    async with aiohttp.ClientSession() as session:
        async with session.get(search_url, params=params) as response:
            data = await response.json()
            return data.get("esearchresult", {}).get("idlist", [])


async def _fetch_article_details(pmids: List[str]) -> List[PubMedArticle]:
    """Fetch detailed information for given PMIDs."""
    if not pmids:
        return []
    
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    email = os.getenv("PUBMED_EMAIL", "research@example.com")
    api_key = os.getenv("PUBMED_API_KEY", "")
    
    fetch_url = f"{base_url}/efetch.fcgi"
    params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
        "email": email
    }
    
    if api_key:
        params["api_key"] = api_key
    
    articles = []
    async with aiohttp.ClientSession() as session:
        async with session.get(fetch_url, params=params) as response:
            xml_data = await response.text()
            root = ET.fromstring(xml_data)
            
            for article_elem in root.findall(".//PubmedArticle"):
                try:
                    # Extract PMID
                    pmid = article_elem.find(".//PMID").text
                    
                    # Extract title
                    title_elem = article_elem.find(".//ArticleTitle")
                    title = title_elem.text if title_elem is not None else "No title"
                    
                    # Extract abstract
                    abstract_texts = []
                    for abstract_text in article_elem.findall(".//AbstractText"):
                        label = abstract_text.get("Label", "")
                        text = abstract_text.text or ""
                        if label:
                            abstract_texts.append(f"{label}: {text}")
                        else:
                            abstract_texts.append(text)
                    abstract = " ".join(abstract_texts)
                    
                    # Extract authors
                    authors = []
                    for author in article_elem.findall(".//Author"):
                        last_name = author.find("LastName")
                        fore_name = author.find("ForeName")
                        if last_name is not None and fore_name is not None:
                            authors.append(f"{fore_name.text} {last_name.text}")
                    
                    # Extract journal
                    journal_elem = article_elem.find(".//Journal/Title")
                    journal = journal_elem.text if journal_elem is not None else "Unknown journal"
                    
                    # Extract publication date
                    pub_date_elem = article_elem.find(".//PubDate")
                    if pub_date_elem is not None:
                        year = pub_date_elem.find("Year")
                        month = pub_date_elem.find("Month")
                        day = pub_date_elem.find("Day")
                        date_parts = []
                        if year is not None:
                            date_parts.append(year.text)
                        if month is not None:
                            date_parts.append(month.text)
                        if day is not None:
                            date_parts.append(day.text)
                        pub_date = " ".join(date_parts)
                    else:
                        pub_date = "Unknown date"
                    
                    # Extract keywords
                    keywords = []
                    for keyword in article_elem.findall(".//Keyword"):
                        if keyword.text:
                            keywords.append(keyword.text)
                    
                    # Extract DOI
                    doi = None
                    for article_id in article_elem.findall(".//ArticleId"):
                        if article_id.get("IdType") == "doi":
                            doi = article_id.text
                            break
                    
                    articles.append(PubMedArticle(
                        pmid=pmid,
                        title=title,
                        abstract=abstract,
                        authors=authors,
                        journal=journal,
                        pub_date=pub_date,
                        keywords=keywords,
                        doi=doi
                    ))
                except Exception as e:
                    logger.error(f"Error parsing article: {e}")
                    continue
    
    return articles


def pubmed_search(query: str, max_results: int = 10, sort: str = "relevance") -> str:
    """
    Search PubMed database for medical and scientific literature.
    
    Args:
        query: Search query for PubMed
        max_results: Maximum number of results to return (default: 10)
        sort: Sort order - 'relevance', 'pub_date', or 'author' (default: 'relevance')
    
    Returns:
        Formatted search results from PubMed
    """
    if not query:
        return "Error: Query parameter is required"
    
    try:
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Search for PMIDs
        pmids = loop.run_until_complete(_search_pubmed(query, max_results, sort))
        
        if not pmids:
            return f"No results found for query: {query}"
        
        # Fetch article details
        articles = loop.run_until_complete(_fetch_article_details(pmids))
        
        # Format results
        results = []
        for article in articles:
            result_text = f"""
**Title:** {article.title}
**Authors:** {', '.join(article.authors[:3])}{'...' if len(article.authors) > 3 else ''}
**Journal:** {article.journal} ({article.pub_date})
**PMID:** {article.pmid}
{f'**DOI:** {article.doi}' if article.doi else ''}
**Abstract:** {article.abstract[:500]}{'...' if len(article.abstract) > 500 else ''}
**Keywords:** {', '.join(article.keywords) if article.keywords else 'None'}
---
"""
            results.append(result_text)
        
        return "\n".join(results)
        
    except Exception as e:
        logger.error(f"PubMed search error: {e}")
        return f"Error searching PubMed: {str(e)}"
    finally:
        loop.close()


def perplexity_sonar(
    query: str,
    mode: str = "reasoning",
    search_domain: str = "general",
    search_recency: str = "all"
) -> str:
    """
    Use Perplexity Sonar for deep research with real-time web access and reasoning.
    
    Args:
        query: Research query or question
        mode: Sonar mode - 'reasoning' for sonar-reasoning-pro, 'deep-research' for sonar-deep-research, 'standard' for sonar-pro
        search_domain: Domain to focus search on (e.g., 'academic', 'news', 'general')
        search_recency: Time filter - 'day', 'week', 'month', 'year', or 'all'
    
    Returns:
        Research results from Perplexity Sonar
    """
    if not query:
        return "Error: Query parameter is required"
    
    api_key = os.getenv("PERPLEXITY_API_KEY", "")
    if not api_key:
        return "Error: PERPLEXITY_API_KEY environment variable not set"
    
    try:
        # Determine the appropriate model based on mode
        if mode == "deep-research":
            model = "sonar-deep-research"
            reasoning_effort = "high"  # Use high effort for deep research
        elif mode == "reasoning":
            model = "sonar-reasoning-pro"
            reasoning_effort = None
        else:  # standard mode
            model = "sonar-pro"
            reasoning_effort = None
        
        # Prepare the request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": query
                }
            ]
        }
        
        # Add search mode for academic searches
        if search_domain == "academic":
            payload["search_mode"] = "academic"
        
        # Add reasoning effort for deep research model
        if reasoning_effort:
            payload["reasoning_effort"] = reasoning_effort
        
        # Add recency filter if not 'all'
        if search_recency and search_recency != "all":
            payload["search_recency_filter"] = search_recency
        
        # Make the API request
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json=payload,
            timeout=60  # Increased timeout for deep research
        )
        
        response.raise_for_status()
        
        # Parse the response
        data = response.json()
        
        # Extract the response content
        if "choices" in data and len(data["choices"]) > 0:
            choice = data["choices"][0]
            if "message" in choice and "content" in choice["message"]:
                content = choice["message"]["content"]
                
                # Format the response
                result_text = f"**Perplexity {model} ({mode} mode)**\n\n{content}"
                
                # Add citations if available
                if "citations" in data and data["citations"]:
                    result_text += "\n\n**Sources:**\n"
                    for i, citation in enumerate(data["citations"], 1):
                        result_text += f"{i}. {citation}\n"
                
                # Add search results if available
                if "search_results" in data and data["search_results"]:
                    result_text += "\n\n**Search Results:**\n"
                    for result in data["search_results"]:
                        title = result.get("title", "Unknown")
                        url = result.get("url", "#")
                        date = result.get("date", "")
                        date_str = f" ({date})" if date else ""
                        result_text += f"- [{title}]({url}){date_str}\n"
                
                return result_text
        
        # Fallback if structure is different
        return f"Unexpected response structure: {json.dumps(data, indent=2)}"
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Perplexity API request error: {e}")
        return f"Perplexity API request error: {str(e)}"
    except Exception as e:
        logger.error(f"Perplexity Sonar error: {e}")
        return f"Error using Perplexity Sonar: {str(e)}"


# For backward compatibility, create simple wrapper functions
def search_pubmed(query: str, max_results: int = 10) -> str:
    """Backward compatible wrapper for pubmed_search."""
    return pubmed_search(query, max_results)


def search_perplexity(query: str, mode: str = "reasoning") -> str:
    """Backward compatible wrapper for perplexity_sonar."""
    return perplexity_sonar(query, mode)