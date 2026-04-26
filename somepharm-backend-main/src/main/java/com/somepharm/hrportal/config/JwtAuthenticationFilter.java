package com.somepharm.hrportal.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Look for the "Authorization" header in the incoming request
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userMatricule;

        // 2. If there is no header, or it doesn't start with "Bearer ", ignore it and move on
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extract the token (we skip the first 7 characters to remove the word "Bearer ")
        jwt = authHeader.substring(7);

        // 4. Ask our JwtService to read the matricule from the token
        userMatricule = jwtService.extractUsername(jwt);

        // 5. If we found a matricule AND the user is not already logged in...
        if (userMatricule != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Fetch the user from our database using the matricule
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userMatricule);

            // 6. If the token is cryptographically valid and not expired...
            if (jwtService.isTokenValid(jwt, userDetails)) {
                // Create an "Authentication Ticket"
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 7. Tell Spring Security: "This user is officially allowed in!"
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 8. Pass the request to the next step
        filterChain.doFilter(request, response);
    }
}